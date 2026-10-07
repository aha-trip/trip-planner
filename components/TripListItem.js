// 首頁「你打開過的行程」列表的一列：顯示日期/出發倒數、成員頭像，
// 手機上左滑可以滑出「刪除」（取代原本太小、容易誤觸的 ✕），滑鼠操作（網頁版）則是 hover 才出現的垃圾桶按鈕。
const TRIP_LIST_DELETE_WIDTH = 72;

const TRIP_DATE_STATUS_STYLE = {
  upcoming: "bg-brand-50 text-brand-700",
  ongoing: "bg-emerald-50 text-emerald-700",
  past: "bg-slate-100 text-slate-500",
  approx: "bg-slate-100 text-slate-500",
  none: "bg-slate-100 text-slate-400",
};

function TripListItem({ trip, onRemove }) {
  const [dragX, setDragX] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const gestureRef = React.useRef(null); // { x, y, baseX, committed }

  const status = getTripDateStatus(trip);

  function onTouchStart(e) {
    const t = e.touches[0];
    gestureRef.current = { x: t.clientX, y: t.clientY, baseX: revealed ? -TRIP_LIST_DELETE_WIDTH : 0, committed: false };
  }

  function onTouchMove(e) {
    const g = gestureRef.current;
    if (!g) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;
    if (!g.committed) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        gestureRef.current = null; // 垂直滑動是在捲頁，不要搶走手勢
        return;
      }
      g.committed = true;
    }
    e.preventDefault();
    const next = Math.min(0, Math.max(-TRIP_LIST_DELETE_WIDTH, g.baseX + dx));
    setDragX(next);
  }

  function onTouchEnd() {
    const g = gestureRef.current;
    if (!g) return;
    const shouldReveal = g.committed && dragX < -TRIP_LIST_DELETE_WIDTH / 2;
    gestureRef.current = null;
    setRevealed(shouldReveal);
    setDragX(shouldReveal ? -TRIP_LIST_DELETE_WIDTH : 0);
  }

  function handleRowClick(e) {
    if (revealed) {
      e.preventDefault();
      setRevealed(false);
      setDragX(0);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={onRemove}
        title="從清單移除"
        className="absolute inset-y-0 right-0 flex items-center justify-center text-white bg-red-500 active:bg-red-600 text-sm font-medium"
        style={{ width: TRIP_LIST_DELETE_WIDTH }}
      >
        刪除
      </button>

      <a
        href={"#/trip/" + trip.tripId + "/wishlist"}
        onClick={handleRowClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative flex items-center justify-between gap-2 rounded-lg border border-amber-100 hover:border-brand-400 bg-white px-3 py-2"
        style={{
          transform: "translateX(" + dragX + "px)",
          transition: gestureRef.current && gestureRef.current.committed ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate">{trip.name}</p>
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
            {trip.destination && <span className="text-xs text-slate-400 truncate max-w-full">{trip.destination}</span>}
            <span className={"shrink-0 text-[11px] px-1.5 py-0.5 rounded-full " + TRIP_DATE_STATUS_STYLE[status.kind]}>
              {status.text}
            </span>
          </div>
        </div>

        <MemberAvatars tripId={trip.tripId} limit={4} />

        {/* 網頁版滑鼠操作沒有滑動手勢，hover 才出現一個小垃圾桶取代滑動 */}
        <button
          type="button"
          onClick={function (e) { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          title="從清單移除"
          className="hidden sm:group-hover:flex shrink-0 w-6 h-6 items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50"
        >
          ✕
        </button>
      </a>
    </div>
  );
}
