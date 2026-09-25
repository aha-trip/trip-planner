// 某個願望清單地點「附近」的其他願望清單地點：依距離排序，可以直接排進某一天
const NEARBY_RADII = [500, 1000, 3000];

function nearbyRadiusLabel(r) {
  return r < 1000 ? r + " 公尺" : r / 1000 + " 公里";
}
function nearbyChipLabel(r) {
  return nearbyRadiusLabel(r) + "內";
}

function NearbyRow({ tripId, w, dist, scheduledDates, dayList }) {
  const [open, setOpen] = React.useState(false);
  const [day, setDay] = React.useState(dayList[0] || "");
  const [busy, setBusy] = React.useState(false);

  async function handleAdd() {
    if (!day) return;
    setBusy(true);
    try {
      await addWishlistItemToDay(tripId, w.id, day);
      setOpen(false);
    } catch (err) {
      console.error(err);
      window.alert("加入行程失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
          <p className="text-xs text-slate-500">
            {formatDistance(dist)} · 步行約 {walkingMinutes(dist)} 分 · {CATEGORY_LABELS[w.category] || w.category}
          </p>
          {scheduledDates.length > 0 && (
            <p className="text-xs text-emerald-700 mt-0.5">已排程：{scheduledDates.map(function (d) { return d.slice(5); }).join("、")}</p>
          )}
        </div>
        {dayList.length > 0 && !open && (
          <button
            onClick={function () { setOpen(true); }}
            className="shrink-0 min-h-[40px] px-3 rounded-lg bg-brand-50 text-brand-700 text-sm active:bg-brand-100"
          >
            ＋ 排進行程
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg border border-amber-200 px-2 py-2.5 text-sm"
            value={day}
            onChange={function (e) { setDay(e.target.value); }}
          >
            {dayList.map(function (d) { return <option key={d} value={d}>{d}</option>; })}
          </select>
          <button
            onClick={handleAdd}
            disabled={busy}
            className="min-h-[40px] px-4 rounded-lg bg-brand-600 text-white text-sm disabled:opacity-50"
          >
            {busy ? "加入中..." : "加入"}
          </button>
          <button onClick={function () { setOpen(false); }} className="min-h-[40px] px-2 text-sm text-slate-400">取消</button>
        </div>
      )}
    </div>
  );
}

function NearbyPanel({ tripId, item, allItems, scheduledDatesByItem, dayList, destination }) {
  const [radius, setRadius] = React.useState(3000);
  const [found, setFound] = React.useState({});
  const [failed, setFailed] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  function coordsOf(w) {
    if (hasCoords(w)) return w;
    return found[w.id] || null;
  }

  const center = coordsOf(item);
  const others = allItems.filter(function (w) { return w.id !== item.id; });
  const failedItems = allItems.filter(function (w) { return failed[w.id] && !coordsOf(w); });
  const [progress, setProgress] = React.useState(null);

  async function fillCoords(list) {
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      const r = await geocodePlace(w, destination);
      if (r) {
        setFound(function (prev) { return Object.assign({}, prev, { [w.id]: { lat: r.lat, lng: r.lng } }); });
        // 存回資料庫，下次（以及其他成員）就不用再查；寫入失敗（例如唯讀）不影響這次顯示
        db.doc("trips/" + tripId + "/wishlistItems/" + w.id).update({ lat: r.lat, lng: r.lng }).catch(function () {});
      } else {
        setFailed(function (prev) { return Object.assign({}, prev, { [w.id]: true }); });
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setBusy(false);
    setProgress(null);
  }

  function retryFailed() {
    const list = failedItems;
    setFailed({});
    fillCoords(list);
  }

  // 打開面板就自動把這個地點和其他沒有座標的地點都查好，不用再按任何按鈕
  React.useEffect(function () {
    const todo = [item].concat(others).filter(function (w) { return !coordsOf(w); });
    if (todo.length) fillCoords(todo);
  }, []);

  const nearby = center
    ? others
        .map(function (w) {
          const c = coordsOf(w);
          return c ? { w: w, dist: haversineMeters(center.lat, center.lng, c.lat, c.lng) } : null;
        })
        .filter(function (x) { return x && x.dist <= radius; })
        .sort(function (a, b) { return a.dist - b.dist; })
    : [];

  return (
    <div className="mt-2 rounded-xl border border-amber-100 bg-cream/60 p-3">
      <div className="flex gap-2 mb-2">
        {NEARBY_RADII.map(function (r) {
          const active = radius === r;
          return (
            <button
              key={r}
              onClick={function () { setRadius(r); }}
              className={
                "min-h-[36px] px-3 rounded-full text-sm border transition " +
                (active ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 bg-white text-slate-600")
              }
            >
              {nearbyChipLabel(r)}
            </button>
          );
        })}
      </div>

      {!center && (
        <p className="text-sm text-slate-500">
          {failed[item.id] ? "查不到這個地點的座標，用更完整的地址重新新增可能比較準。" : "正在查詢這個地點的座標…"}
        </p>
      )}

      {center && !busy && nearby.length === 0 && (
        <p className="text-sm text-slate-500">{nearbyRadiusLabel(radius)}內沒有其他願望清單地點。</p>
      )}

      {center && nearby.length > 0 && NEARBY_RADII.map(function (r, idx) {
        const lower = idx === 0 ? 0 : NEARBY_RADII[idx - 1];
        const group = nearby.filter(function (x) { return x.dist > lower && x.dist <= r || (idx === 0 && x.dist <= r); });
        if (group.length === 0) return null;
        const title = idx === 0 ? nearbyRadiusLabel(r) + "內" : nearbyRadiusLabel(lower) + "～" + nearbyRadiusLabel(r);
        return (
          <div key={r} className="mb-2">
            <p className="text-xs font-medium text-brand-700 mb-1">{title}（{group.length}）</p>
            <div className="bg-white rounded-lg border border-amber-100 divide-y divide-amber-100">
              {group.map(function (x) {
                return (
                  <NearbyRow
                    key={x.w.id}
                    tripId={tripId}
                    w={x.w}
                    dist={x.dist}
                    scheduledDates={scheduledDatesByItem[x.w.id] || []}
                    dayList={dayList}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {busy && progress && (
        <p className="mt-2 text-sm text-slate-500">
          正在查詢地點座標… {progress.done}/{progress.total}（每個約 1～5 秒，查到的會存起來，下次就不用等）
        </p>
      )}
      {!busy && failedItems.length > 0 && (
        <p className="mt-2 text-sm text-slate-500">
          查不到座標的地點：{failedItems.map(function (w) { return w.name; }).join("、")}。可以按該地點的「編輯」改成更完整的地址，再{" "}
          <button onClick={retryFailed} className="text-brand-700 underline">重新查詢</button>。
        </p>
      )}

      <p className="text-[11px] text-slate-400 mt-2">
        距離是直線距離，步行時間是估算。座標查詢：Google 或 © OpenStreetMap contributors。
      </p>
    </div>
  );
}
