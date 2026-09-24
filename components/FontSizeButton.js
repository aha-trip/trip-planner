// 字體大小：小 A / 大 A 兩顆按鈕，點一下縮小或放大一級（手機好按，不用拖拉桿）。照顧長輩/視力不便的使用者。
function FontSizeButton() {
  const { scale, levels } = useFontScale();
  const level = levels.indexOf(scale);

  function step(dir) {
    const next = Math.max(0, Math.min(levels.length - 1, level + dir));
    if (next !== level) applyFontScale(levels[next]);
  }

  return (
    <div
      role="group"
      aria-label="調整字體大小"
      className="shrink-0 h-10 flex items-center rounded-full border border-amber-200 bg-white overflow-hidden"
    >
      <button
        type="button"
        onClick={function () { step(-1); }}
        disabled={level <= 0}
        aria-label="縮小字體"
        title="縮小字體"
        className="w-10 h-10 flex items-center justify-center font-bold text-slate-600 disabled:opacity-30 active:bg-amber-50"
      >
        <span style={{ fontSize: "13px" }}>A</span>
      </button>
      <span className="w-px h-5 bg-amber-200" />
      <button
        type="button"
        onClick={function () { step(1); }}
        disabled={level >= levels.length - 1}
        aria-label="放大字體"
        title="放大字體"
        className="w-10 h-10 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 active:bg-amber-50"
      >
        <span style={{ fontSize: "22px" }}>A</span>
      </button>
    </div>
  );
}
