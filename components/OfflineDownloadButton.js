// O3：「下載這趟行程供離線使用」的狀態圖示，放在標題列字體大小按鈕旁邊。小圖示＋點擊才展開
// 詳細狀態/動作，跟 FontSizeButton 同樣的圓角小按鈕風格，不佔標題列太多空間。
function OfflineDownloadButton({ tripId, trip }) {
  const [info, setInfo] = React.useState(function () { return getOfflineSnapshotInfo(tripId); });
  const [downloading, setDownloading] = React.useState(false);
  const [progressText, setProgressText] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const online = useOnlineStatus();
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

  async function handleDownload() {
    if (!online) {
      window.alert("目前離線，連上網路才能下載最新資料。");
      return;
    }
    setDownloading(true);
    try {
      const result = await downloadTripForOffline(tripId, trip, setProgressText);
      setInfo(result);
    } catch (err) {
      console.error(err);
      window.alert("下載失敗，請稍後再試。");
    } finally {
      setDownloading(false);
      setProgressText("");
    }
  }

  const Icon = info ? CheckCircleIcon : CloudIcon;
  const label = downloading
    ? "下載中..."
    : info
    ? "已可離線・最後同步 " + formatSyncedTime(info.at) + (info.bytes > 0 ? "（" + formatBytes(info.bytes) + "）" : "")
    : "下載供離線使用";

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={function () { setOpen(!open); }}
        aria-label={label}
        title={label}
        className={
          "w-8 h-8 flex items-center justify-center rounded-full border transition " +
          (info ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-white text-slate-600")
        }
      >
        <Icon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-amber-100 p-3 z-30 text-sm">
          <p className={info ? "text-emerald-700" : "text-slate-600"}>{label}</p>
          <button
            type="button"
            disabled={downloading}
            onClick={function () { handleDownload(); setOpen(false); }}
            className="w-full mt-2 min-h-[36px] rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-medium"
          >
            {downloading ? "下載中..." + progressText : info ? "重新整理離線內容" : "下載供離線使用"}
          </button>
        </div>
      )}
    </div>
  );
}
