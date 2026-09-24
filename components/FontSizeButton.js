// 用拉桿(滑桿)調整全站字體大小（照顧長輩/視力不便的使用者），點「A」展開小面板
function FontSizeButton({ className }) {
  const { scale, levels } = useFontScale();
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const level = levels.indexOf(scale);
  const levelNames = ["標準", "大", "特大", "加大"];

  React.useEffect(function () {
    if (!open) return;
    function onOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return function () { document.removeEventListener("mousedown", onOutsideClick); };
  }, [open]);

  function handleSlide(e) {
    const idx = parseInt(e.target.value, 10);
    applyFontScale(levels[idx]);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={function () { setOpen(function (v) { return !v; }); }}
        title="調整字體大小"
        aria-label="調整字體大小"
        className={
          (className || "") +
          " shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-amber-200 bg-white hover:border-brand-400 text-slate-600 font-bold"
        }
      >
        <span style={{ fontSize: (13 + level * 2.5) + "px" }}>A</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-amber-100 p-4 z-30">
          <p className="text-sm font-semibold text-slate-700 mb-2">字體大小：{levelNames[level]}</p>
          <input
            type="range"
            min="0"
            max={levels.length - 1}
            step="1"
            value={level}
            onChange={handleSlide}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>小</span>
            <span>大</span>
          </div>
        </div>
      )}
    </div>
  );
}
