// 點圖片放大看的全螢幕預覽，items 是同一個清單裡的所有圖片，可以左右切換
function ImageLightbox({ items, startIndex, onClose }) {
  const [index, setIndex] = React.useState(startIndex);
  const hasMultiple = items.length > 1;

  function prev() { setIndex(function (i) { return (i - 1 + items.length) % items.length; }); }
  function next() { setIndex(function (i) { return (i + 1) % items.length; }); }

  React.useEffect(function () {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
      if (hasMultiple && e.key === "ArrowLeft") prev();
      if (hasMultiple && e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return function () { window.removeEventListener("keydown", onKeyDown); };
  }, [hasMultiple, onClose]);

  const current = items[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 px-4 py-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
        aria-label="關閉"
      >
        ×
      </button>

      {hasMultiple && (
        <button
          onClick={function (e) { e.stopPropagation(); prev(); }}
          className="absolute left-2 sm:left-4 text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="上一張"
        >
          ‹
        </button>
      )}

      <div className="max-w-full max-h-full flex flex-col items-center" onClick={function (e) { e.stopPropagation(); }}>
        <img src={current.imageUrl} alt={current.caption || "購物截圖"} className="max-w-full max-h-[75vh] rounded-lg object-contain" />
        {current.caption && <p className="text-white text-sm mt-3 text-center">{current.caption}</p>}
        {hasMultiple && <p className="text-white/60 text-xs mt-1">{index + 1} / {items.length}</p>}
      </div>

      {hasMultiple && (
        <button
          onClick={function (e) { e.stopPropagation(); next(); }}
          className="absolute right-2 sm:right-4 text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          aria-label="下一張"
        >
          ›
        </button>
      )}
    </div>
  );
}
