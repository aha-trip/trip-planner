// 手機版「更多」選單裡的「設定」：行程成員、編輯行程資訊、帳號、分享連結、清除快取這幾個
// 比較少用的動作，收進這個彈出面板，不要全部攤開佔掉「更多」選單一大半，手機版才不會太雜亂。
function SettingsPanel({ onOpenMembers, onEditTrip, onShare, copied, onClose }) {
  const rowClass = "w-full min-h-[44px] flex items-center gap-3 px-4 text-left text-sm text-slate-700 active:bg-amber-50";

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="border-b border-amber-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <GearIcon className="w-4 h-4 text-brand-600" /> 設定
          </h3>
          <button onClick={onClose} className="text-slate-400 w-8 h-8 flex items-center justify-center" aria-label="關閉">✕</button>
        </div>

        <div className="divide-y divide-amber-100">
          <button type="button" className={rowClass} onClick={function () { onClose(); onOpenMembers(); }}>
            <PeopleIcon className="w-4 h-4 text-brand-600" /> 行程成員
          </button>

          <button type="button" className={rowClass} onClick={function () { onClose(); onEditTrip(); }}>
            <PencilIcon className="w-4 h-4 text-brand-600" /> 編輯行程資訊
          </button>

          <AccountButton row={true} />

          <button type="button" className={rowClass} onClick={function () { onClose(); onShare(); }}>
            <LinkIcon className="w-4 h-4 text-brand-600" />
            {copied ? "已複製連結！" : "複製分享連結"}
          </button>

          <button
            type="button"
            className={rowClass}
            onClick={function () {
              onClose();
              if (window.confirm("清除本機快取並重新同步？（不會刪除任何資料，只是讓這台裝置重新跟伺服器拿一次最新內容，畫面會重新整理）")) {
                clearFirestoreCacheAndReload();
              }
            }}
          >
            <RefreshIcon className="w-4 h-4 text-brand-600" />
            清除本機快取並重新同步
          </button>
        </div>
      </div>
    </div>
  );
}
