// 分享這趟行程：故意把「單純分享給別人看」跟「邀請對方一起編輯」拆成兩個清楚、各自有說明的
// 選項，不要用同一個連結、同一顆按鈕含糊帶過——這兩種分享的社交意圖差很多（秀給陌生人看 vs.
// 邀請信任的人一起改行程），混在一起很容易讓人不小心把編輯權限給了只是想看看的人。
function ShareLinkPanel({ tripId, trip, onClose }) {
  const [copiedKind, setCopiedKind] = React.useState(null); // null | "preview" | "edit"

  function buildUrl(tab) {
    return window.location.origin + window.location.pathname + "#/trip/" + tripId + "/" + tab;
  }

  async function share(tab, kind, shareText) {
    const url = buildUrl(tab);
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        await window.Capacitor.Plugins.Share.share({
          title: trip.name,
          text: shareText,
          url: url,
          dialogTitle: "分享行程連結",
        });
      } catch (err) {
        // 使用者自己關掉分享視窗也會跑到這裡，不是真的錯誤，不用額外處理
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKind(kind);
      setTimeout(function () { setCopiedKind(null); }, 2000);
    } catch (err) {
      window.prompt("複製這個連結分享給大家：", url);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center sm:px-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-3"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">分享這趟行程</h3>
          <button onClick={onClose} className="text-slate-400 w-8 h-8 flex items-center justify-center" aria-label="關閉">✕</button>
        </div>

        <button
          type="button"
          onClick={function () {
            share("share", "preview", "來看看「" + trip.name + "」這趟行程！" + (trip.allowCopy ? "喜歡的話也可以直接複製一份給自己用。" : ""));
          }}
          className="w-full text-left rounded-xl border-2 border-brand-200 bg-brand-50/60 p-3 hover:border-brand-400 transition"
        >
          <p className="font-medium text-slate-800 flex items-center gap-1.5">
            <EyeIcon className="w-4 h-4 text-brand-600" /> 分享給別人看
            {copiedKind === "preview" && <span className="text-xs text-brand-600 font-normal">已複製連結！</span>}
          </p>
          <p className="text-xs text-slate-500 mt-1">對方只會看到行程內容，不會變成可以一起編輯的成員{trip.allowCopy ? "；如果喜歡，可以自己選擇要不要複製一份" : ""}。想分享給不熟的人、或單純想秀行程時用這個。</p>
        </button>

        <button
          type="button"
          onClick={function () {
            share("wishlist", "edit", "一起規劃「" + trip.name + "」吧！");
          }}
          className="w-full text-left rounded-xl border-2 border-amber-200 p-3 hover:border-brand-400 transition"
        >
          <p className="font-medium text-slate-800 flex items-center gap-1.5">
            <PeopleIcon className="w-4 h-4 text-brand-600" /> 邀請一起編輯
            {copiedKind === "edit" && <span className="text-xs text-brand-600 font-normal">已複製連結！</span>}
          </p>
          <p className="text-xs text-slate-500 mt-1">對方打開連結就能直接加入，跟你一起新增/修改這趟行程的內容。想找朋友、家人一起規劃時用這個。</p>
        </button>
      </div>
    </div>
  );
}
