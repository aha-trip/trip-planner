function DayColumn({ tripId, date, itineraryItems, wishlistById, trip, nickname, dayList, allWishlist, scheduledDatesByItem, memberNames }) {
  const [expandedId, setExpandedId] = React.useState(null);
  const sorted = React.useMemo(function () {
    return itineraryItems
      .filter(function (i) { return i.date === date; })
      .slice()
      .sort(function (a, b) { return a.order - b.order; });
  }, [itineraryItems, date]);

  const [computing, setComputing] = React.useState(false);

  const signature = sorted
    .map(function (i) {
      const manualTime = i.travelTimeSource === "manual" ? i.travelTimeMinutes : "";
      return [i.id, i.order, i.transportMode, i.durationMinutes, i.travelTimeSource, manualTime].join(":");
    })
    .join("|") + "||first-arrival:" + (sorted[0] ? sorted[0].arrivalTime : "");

  React.useEffect(function () {
    if (sorted.length === 0) return;
    let cancelled = false;

    async function recalc() {
      setComputing(true);
      let prevDeparture = null;

      for (let i = 0; i < sorted.length; i++) {
        if (cancelled) return;
        const curr = sorted[i];
        const currLoc = wishlistById[curr.wishlistItemId];
        const updates = {};

        if (i === 0) {
          const arrival = curr.arrivalTime || "09:00";
          const departure = addMinutesToTime(arrival, curr.durationMinutes || 0);
          if (curr.arrivalTime !== arrival) updates.arrivalTime = arrival;
          if (curr.departureTime !== departure) updates.departureTime = departure;
          prevDeparture = departure;
        } else {
          const prev = sorted[i - 1];
          const prevLoc = wishlistById[prev.wishlistItemId];
          let travelMinutes = curr.travelTimeMinutes;
          let travelMeters = curr.travelDistanceMeters;

          if (curr.travelTimeSource !== "manual" && prevLoc && currLoc) {
            const result = await calculateTravelTime(prevLoc, currLoc, curr.transportMode);
            if (result) {
              travelMinutes = result.minutes;
              travelMeters = result.meters;
            }
          }

          const arrival = addMinutesToTime(prevDeparture, travelMinutes || 0);
          const departure = addMinutesToTime(arrival, curr.durationMinutes || 0);

          if (travelMinutes !== curr.travelTimeMinutes) updates.travelTimeMinutes = travelMinutes;
          if (travelMeters !== curr.travelDistanceMeters) updates.travelDistanceMeters = travelMeters;
          if (arrival !== curr.arrivalTime) updates.arrivalTime = arrival;
          if (departure !== curr.departureTime) updates.departureTime = departure;
          prevDeparture = departure;
        }

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
