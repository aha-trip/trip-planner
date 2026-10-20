// 標題列右上角的「功能」選單：行程成員、帳號登入/登出、分享連結都收在這裡。
// 只在網頁版（sm 以上）顯示——手機版把同一批動作收進畫面下方 <BottomNav/> 的「更多」選單，
// 避免手機上同時有兩個入口長得很像的選單（這裡的跟 BottomNav 的）讓人搞混。
function HeaderMenu({ open, setOpen, onOpenMembers, onShare, onEditTrip, copied }) {
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    if (!open) return;
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return function () {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  const rowClass = "w-full min-h-[44px] flex items-center gap-3 px-4 text-left text-sm text-slate-700 active:bg-amber-50";

  return (
    <div className="hidden sm:block relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={function () { setOpen(!open); }}
        aria-label="功能選單"
        aria-expanded={open}
        className={
          "w-9 h-9 flex items-center justify-center rounded-full border transition " +
          (open ? "border-brand-400 bg-brand-50 text-brand-700" : "border-amber-200 bg-white text-slate-600")
        }
      >
        <MenuIcon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden z-30 divide-y divide-amber-100">
          <button
            type="button"
            className={rowClass}
            onClick={function () { setOpen(false); onOpenMembers(); }}
          >
            <PeopleIcon className="w-4 h-4 text-brand-600" /> 行程成員
          </button>

          <button
            type="button"
            className={rowClass}
            onClick={function () { setOpen(false); onEditTrip(); }}
          >
            <PencilIcon className="w-4 h-4 text-brand-600" /> 編輯行程資訊
          </button>

          <AccountButton row={true} />

          <button type="button" className={rowClass} onClick={onShare}>
            <span className="w-5 text-center text-brand-600">🔗</span>
            {copied ? "已複製連結！" : "複製分享連結"}
          </button>

          <button
            type="button"
            className={rowClass}
            onClick={function () {
              setOpen(false);
              if (window.confirm("清除本機快取並重新同步？（不會刪除任何資料，只是讓這台裝置重新跟伺服器拿一次最新內容，畫面會重新整理）")) {
                clearFirestoreCacheAndReload();
              }
            }}
          >
            <span className="w-5 text-center text-brand-600">🧹</span>
            清除本機快取並重新同步
          </button>
        </div>
      )}
    </div>
  );
}
