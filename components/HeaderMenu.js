// 標題列右上角的「功能」選單：行程成員、字體大小、帳號登入/登出、分享連結都收在這裡，
// 標題列只剩 logo + 行程名稱 + 一顆按鈕，手機上不會擠。
function HeaderMenu({ open, setOpen, onOpenMembers, onShare, copied }) {
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
    <div className="relative shrink-0" ref={wrapRef}>
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


          <AccountButton row={true} />

          <button type="button" className={rowClass} onClick={onShare}>
            <span className="w-5 text-center text-brand-600">🔗</span>
            {copied ? "已複製連結！" : "複製分享連結"}
          </button>
        </div>
      )}
    </div>
  );
}
