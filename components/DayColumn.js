function DayColumn({ tripId, date, itineraryItems, wishlistById, trip, nickname, dayList, allWishlist, scheduledDatesByItem, memberNames }) {
  const [expandedId, setExpandedId] = React.useState(null);
  const sorted = React.useMemo(function () {
    return itineraryItems
      .filter(function (i) { return i.date === date; })
      .slice()
      .sort(function (a, b) { return a.order - b.order; });
  }, [itineraryItems, date]);

  const [computing, setComputing] = React.useState(false);

  // 排程演算法：index 0 永遠是「錨點」；其他項目只要使用者自己輸入過時間
  // (arrivalTimeSource === "manual") 也會變成錨點。兩個錨點之間的項目用「回推」算——
  // 從後面那個錨點往前推算每一項該幾點出發、幾點到，符合「我要幾點前到某地，前面幾站幾點該走」
  // 的排程習慣；最後一個錨點之後沒有下一個限制，維持原本「往後累加」的算法。
  const signature = sorted
    .map(function (i) {
      const manualTravel = i.travelTimeSource === "manual" ? i.travelTimeMinutes : "";
      const manualArrival = i.arrivalTimeSource === "manual" ? i.arrivalTime : "";
      return [i.id, i.order, i.transportMode, i.durationMinutes, i.travelTimeSource, manualTravel, i.arrivalTimeSource, manualArrival].join(":");
    })
    .join("|") + "||first-arrival:" + (sorted[0] ? sorted[0].arrivalTime : "");

  React.useEffect(function () {
    if (sorted.length === 0) return;
    let cancelled = false;

    async function travelInto(j) {
      // 算「第 j-1 項 -> 第 j 項」的交通時間；使用者自己鎖定過就不重算
      const prev = sorted[j - 1];
      const curr = sorted[j];
      if (curr.travelTimeSource === "manual") return curr.travelTimeMinutes || 0;
      const prevLoc = wishlistById[prev.wishlistItemId];
      const currLoc = wishlistById[curr.wishlistItemId];
      if (!prevLoc || !currLoc) return curr.travelTimeMinutes || 0;
      const result = await calculateTravelTime(prevLoc, currLoc, curr.transportMode);
      return result ? result.minutes : (curr.travelTimeMinutes || 0);
    }

    async function recalc() {
      setComputing(true);
      const n = sorted.length;
      const arrival = new Array(n).fill(null);
      const departure = new Array(n).fill(null);
      const travel = new Array(n).fill(null); // travel[j]：進入第 j 項的交通時間（分鐘）

      const anchors = [];
      for (let i = 0; i < n; i++) {
        if (i === 0 || sorted[i].arrivalTimeSource === "manual") anchors.push(i);
      }
      anchors.forEach(function (i) {
        arrival[i] = sorted[i].arrivalTime || (i === 0 ? "09:00" : "12:00");
        departure[i] = addMinutesToTime(arrival[i], sorted[i].durationMinutes || 0);
      });

      // 兩個錨點之間：從後面那個錨點回推過去
      for (let a = 0; a < anchors.length - 1 && !cancelled; a++) {
        const from = anchors[a];
        const to = anchors[a + 1];
        for (let j = to; j > from + 1; j--) {
          if (cancelled) return;
          const t = await travelInto(j);
          travel[j] = t;
          departure[j - 1] = addMinutesToTime(arrival[j], -t);
          arrival[j - 1] = addMinutesToTime(departure[j - 1], -(sorted[j - 1].durationMinutes || 0));
        }
        if (!cancelled) travel[from + 1] = travel[from + 1] != null ? travel[from + 1] : await travelInto(from + 1);
      }

      // 最後一個錨點之後：照原本的邏輯往後累加
      const lastAnchor = anchors[anchors.length - 1];
      for (let j = lastAnchor + 1; j < n && !cancelled; j++) {
        const t = await travelInto(j);
        travel[j] = t;
        arrival[j] = addMinutesToTime(departure[j - 1], t);
        departure[j] = addMinutesToTime(arrival[j], sorted[j].durationMinutes || 0);
      }

      if (cancelled) return;

      for (let i = 0; i < n; i++) {
        const curr = sorted[i];
        const updates = {};
        if (arrival[i] != null && arrival[i] !== curr.arrivalTime) updates.arrivalTime = arrival[i];
        if (departure[i] != null && departure[i] !== curr.departureTime) updates.departureTime = departure[i];
        if (i > 0 && travel[i] != null && travel[i] !== curr.travelTimeMinutes) updates.travelTimeMinutes = travel[i];
        if (Object.keys(updates).length > 0 && !cancelled) {
          await db.doc("trips/" + tripId + "/itineraryItems/" + curr.id).update(updates);
        }
      }
      if (!cancelled) setComputing(false);
    }

    recalc();
    return function () { cancelled = true; };
    // eslint-disable-next-line
  }, [signature]);

  async function handleMove(index, direction) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[otherIndex];
    const batch = db.batch();
    batch.update(db.doc("trips/" + tripId + "/itineraryItems/" + a.id), { order: b.order });
    batch.update(db.doc("trips/" + tripId + "/itineraryItems/" + b.id), { order: a.order });
    await batch.commit();
  }

  // 拖曳排序：用 pointer events 手刻，不靠 HTML5 drag-and-drop（iOS Safari 觸控不支援）。
  // dragRef 存目前拖曳狀態，用 forceTick 手動觸發重繪，避免每次 pointermove 都重建 window 監聽器。
  const rowRefs = React.useRef({});
  const dragRef = React.useRef(null);
  const [, forceTick] = React.useState(0);

  function handleDragStart(id, e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (expandedId === id) setExpandedId(null);
    dragRef.current = { id: id, startY: e.clientY, deltaY: 0 };
    forceTick(function (n) { return n + 1; });
  }

  function commitDrop() {
    const drag = dragRef.current;
    if (!drag) return;
    const draggedEl = rowRefs.current[drag.id];
    if (!draggedEl) return;
    const draggedRect = draggedEl.getBoundingClientRect();
    const draggedCenter = draggedRect.top + draggedRect.height / 2;
    const others = sorted.filter(function (i) { return i.id !== drag.id; });
    let targetIndex = others.length;
    for (let i = 0; i < others.length; i++) {
      const el = rowRefs.current[others[i].id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (draggedCenter < r.top + r.height / 2) { targetIndex = i; break; }
    }
    const newOrderIds = others.map(function (i) { return i.id; });
    newOrderIds.splice(targetIndex, 0, drag.id);
    const batch = db.batch();
    let changed = false;
    newOrderIds.forEach(function (id, idx) {
      const it = sorted.find(function (i) { return i.id === id; });
      const newOrder = (idx + 1) * 1000;
      if (it.order !== newOrder) {
        changed = true;
        batch.update(db.doc("trips/" + tripId + "/itineraryItems/" + id), { order: newOrder });
      }
    });
    if (changed) batch.commit();
  }

  React.useEffect(function () {
    if (!dragRef.current) return;
    function onMove(e) {
      if (!dragRef.current) return;
      if (e.cancelable) e.preventDefault();
      dragRef.current = Object.assign({}, dragRef.current, { deltaY: e.clientY - dragRef.current.startY });
      forceTick(function (n) { return n + 1; });
    }
    function onUp() {
      commitDrop();
      dragRef.current = null;
      forceTick(function (n) { return n + 1; });
    }
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return function () {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line
  }, [dragRef.current && dragRef.current.id]);

  const firstLoc = sorted.length > 0 ? wishlistById[sorted[0].wishlistItemId] : null;
  const dayLat = (firstLoc && firstLoc.lat) != null ? firstLoc.lat : trip.lat;
  const dayLng = (firstLoc && firstLoc.lng) != null ? firstLoc.lng : trip.lng;

  return (
    <div className="space-y-1">
      <DayWeatherBanner tripId={tripId} date={date} lat={dayLat} lng={dayLng} />

      {sorted.length === 0 && (
        <p className="text-slate-400 text-sm py-6 text-center">這天還沒有安排行程，從願望清單加入吧！</p>
      )}

      {sorted.map(function (item, index) {
        const isDragging = Boolean(dragRef.current) && dragRef.current.id === item.id;
        return (
          <div key={item.id}>
            {index > 0 && <TravelSegment tripId={tripId} item={item} computing={computing} />}
            <div
              ref={function (el) { if (el) rowRefs.current[item.id] = el; }}
              style={isDragging ? { transform: "translateY(" + dragRef.current.deltaY + "px)", position: "relative", zIndex: 30 } : undefined}
              className={isDragging ? "shadow-lg rounded-xl" : undefined}
            >
              <ItineraryItemCard
                tripId={tripId}
                item={item}
                wishlistItem={wishlistById[item.wishlistItemId]}
                isFirst={index === 0}
                isLast={index === sorted.length - 1}
                onMoveUp={function () { handleMove(index, -1); }}
                onMoveDown={function () { handleMove(index, 1); }}
                nickname={nickname}
                expanded={expandedId === item.id}
                onToggle={function () { setExpandedId(expandedId === item.id ? null : item.id); }}
                dayList={dayList}
                allWishlist={allWishlist}
                scheduledDatesByItem={scheduledDatesByItem}
                destination={trip.destination}
                memberNames={memberNames}
                onDragHandleDown={function (e) { handleDragStart(item.id, e); }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
