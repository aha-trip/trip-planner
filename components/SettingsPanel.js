// 「更多」選單裡的「設定」子清單：行程成員/編輯行程資訊/帳號/分享連結/清除快取這幾個比較少用
// 的動作。只回傳列表內容本身（沒有自己的外框/遮罩），讓 BottomNav 把它放進跟「更多」選單
// 同一個外框裡顯示——寬度才會跟外層一致，不會切換成另一個尺寸的面板。
function SettingsPanel({ onOpenMembers, onEditTrip, onShare, copied, onBack, onClose }) {
  const rowClass = "w-full min-h-[44px] flex items-center gap-3 px-4 text-left text-sm text-slate-700 active:bg-amber-50";

  return (
    <React.Fragment>
      <button type="button" className={rowClass + " font-medium text-slate-500"} onClick={onBack}>
        <span className="w-4 h-4 inline-flex items-center justify-center">‹</span> 返回
      </button>

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
    </React.Fragment>
  );
}
