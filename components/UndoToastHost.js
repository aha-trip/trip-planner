// 掛在最外層一次，顯示「已刪除 XXX ﹝復原﹞」的浮動提示條
function UndoToastHost() {
  const [toast, setToast] = React.useState(null);

  React.useEffect(function () {
    undoToastListeners.push(setToast);
    return function () {
      const idx = undoToastListeners.indexOf(setToast);
      if (idx >= 0) undoToastListeners.splice(idx, 1);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 max-w-[90vw]">
      <span className="truncate">{toast.message}</span>
      <button
        onClick={function () {
          toast.onUndo();
          dismissUndoToast();
        }}
        className="shrink-0 text-brand-300 font-semibold hover:text-brand-200"
      >
        復原
      </button>
    </div>
  );
}
