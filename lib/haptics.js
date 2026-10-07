// 震動回饋的小工具：網頁版（沒有 window.Capacitor）安靜地什麼都不做，
// 包裝成 App 之後才會真的震動。呼叫端不用自己判斷環境，直接呼叫就好。
function hapticsAvailable() {
  return Boolean(
    window.Capacitor &&
    window.Capacitor.isNativePlatform &&
    window.Capacitor.isNativePlatform() &&
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.Haptics
  );
}

// 輕點一下的回饋：滑動經過門檻、切換分頁這種「狀態改變了」的提示
function hapticLight() {
  if (!hapticsAvailable()) return;
  window.Capacitor.Plugins.Haptics.impact({ style: "LIGHT" }).catch(function () {});
}

// 比較重的回饋：刪除這種有點份量的動作
function hapticMedium() {
  if (!hapticsAvailable()) return;
  window.Capacitor.Plugins.Haptics.impact({ style: "MEDIUM" }).catch(function () {});
}
