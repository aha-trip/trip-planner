// 幣別搜尋選單：輸入代碼或名稱過濾，點選後關閉
function CurrencyPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return function () {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, []);

  const results = searchCurrencies(query);
  const current = findCurrency(value);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={function () { setOpen(!open); setQuery(""); }}
        className="min-h-[44px] w-full rounded-lg border border-amber-200 px-3 text-sm text-left bg-white flex items-center justify-between"
      >
        <span>{current.label}</span>
        <span className="text-slate-400 text-xs">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-amber-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <input
            autoFocus
            className="w-full px-3 py-2 text-sm border-b border-amber-100 focus:outline-none"
            placeholder="搜尋幣別代碼或名稱..."
            value={query}
            onChange={function (e) { setQuery(e.target.value); }}
          />
          {results.map(function (c) {
            return (
              <button
                type="button"
                key={c.code}
                onClick={function () { onChange(c.code); setOpen(false); }}
                className={
                  "block w-full text-left px-3 py-2.5 text-sm hover:bg-amber-50 " +
                  (c.code === value ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-700")
                }
              >
                {c.label}
              </button>
            );
          })}
          {results.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">找不到符合的幣別</p>}
        </div>
      )}
    </div>
  );
}
