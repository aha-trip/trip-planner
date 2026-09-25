// 選擇要連結的願望清單地點：可以用名稱/地址搜尋（地點多的時候不用在下拉選單裡慢慢找）
function WishlistPicker({ items, value, onPick, onClose }) {
  const [q, setQ] = React.useState("");
  const keyword = q.trim().toLowerCase();
  const list = (items || []).filter(function (w) {
    if (w.deletedAt) return false;
    if (!keyword) return true;
    return [w.name, w.address, w.notes].filter(Boolean).join(" ").toLowerCase().indexOf(keyword) >= 0;
  });

  const rowClass = "w-full min-h-[48px] px-3 py-2 text-left flex items-center justify-between gap-2 active:bg-amber-50";

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4 pb-6 max-h-[80vh] flex flex-col"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-800">連結到哪個地點？</h2>
          <button onClick={onClose} className="w-10 h-10 -mr-2 text-slate-400 text-2xl leading-none" aria-label="關閉">×</button>
        </div>
        <input
          autoFocus
          className="w-full rounded-lg border border-amber-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="搜尋地點名稱、地址..."
          value={q}
          onChange={function (e) { setQ(e.target.value); }}
        />
        <div className="mt-2 overflow-y-auto flex-1 divide-y divide-amber-100 border border-amber-100 rounded-lg">
          <button className={rowClass + " text-slate-500"} onClick={function () { onPick(""); }}>
            <span>不連結地點</span>
            {!value && <span className="text-brand-600">✓</span>}
          </button>
          {list.map(function (w) {
            return (
              <button key={w.id} className={rowClass} onClick={function () { onPick(w.id); }}>
                <span className="min-w-0">
                  <span className="block text-sm text-slate-800 truncate">{w.name}</span>
                  {w.address && <span className="block text-xs text-slate-400 truncate">{w.address}</span>}
                </span>
                {value === w.id && <span className="text-brand-600 shrink-0">✓</span>}
              </button>
            );
          })}
          {list.length === 0 && <p className="text-sm text-slate-400 p-3">找不到符合的地點</p>}
        </div>
      </div>
    </div>
  );
}
