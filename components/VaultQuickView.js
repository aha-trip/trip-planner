// V4「快速出示模式」：全螢幕放大憑證照片，方便入場前直接出示給工作人員掃描/查看。
// 盡量讓螢幕保持亮著（用瀏覽器標準的 Screen Wake Lock API）——這不是每個瀏覽器/系統版本
// 都支援，不支援就安靜略過，使用者自己動一下螢幕還是亮著的，不影響基本使用。
// 調到「最亮」這件事瀏覽器/網頁完全做不到，需要真正的原生外掛才能控制系統螢幕亮度，
// 先誠實不做，不要裝作有做到。
function VaultQuickView({ item, onClose }) {
  const wakeLockRef = React.useRef(null);

  React.useEffect(function () {
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then(function (lock) { wakeLockRef.current = lock; }).catch(function () {});
    }
    return function () {
      if (wakeLockRef.current) wakeLockRef.current.release().catch(function () {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white text-lg"
        aria-label="關閉"
      >
        ✕
      </button>
      <p className="text-white text-center font-medium mb-3">{item.title}</p>
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="max-w-full max-h-[75vh] rounded-lg object-contain" onClick={function (e) { e.stopPropagation(); }} />
      )}
      {item.confirmationCode && (
        <p className="text-white/80 text-sm mt-3">預約編號：{item.confirmationCode}</p>
      )}
    </div>
  );
}
