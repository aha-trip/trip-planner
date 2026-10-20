// O3：「下載這趟行程供離線使用」的狀態列，放在願望清單頁最上面（跟之前「匯入行程」按鈕同一個位置）。
function OfflineDownloadButton({ tripId, trip }) {
  const [info, setInfo] = React.useState(function () { return getOfflineSnapshotInfo(tripId); });
  const [downloading, setDownloading] = React.useState(false);
  const [progressText, setProgressText] = React.useState("");
  const online = useOnlineStatus();

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

  if (downloading) {
    return (
      <button
        type="button"
        disabled
        className="w-full mb-3 min-h-[40px] px-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700 font-medium inline-flex items-center justify-center gap-1.5"
      >
        ☁️ 下載中...{progressText}
      </button>
    );
  }

  if (info) {
    return (
      <button
        type="button"
        onClick={handleDownload}
        title="重新整理離線內容"
        className="w-full mb-3 min-h-[40px] px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 font-medium inline-flex items-center justify-center gap-1.5"
      >
        ✅ 已可離線・最後同步 {formatSyncedTime(info.at)}
        {info.bytes > 0 ? "（" + formatBytes(info.bytes) + "）" : ""}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="w-full mb-3 min-h-[40px] px-3 rounded-lg border border-brand-200 bg-brand-50 text-sm text-brand-700 font-medium inline-flex items-center justify-center gap-1.5"
    >
      ☁️ 下載供離線使用
    </button>
  );
}
