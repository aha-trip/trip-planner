// 空中更新（OTA）：capacitor.config.json 拿掉 server.url 之後，App 改讀打包進 App 本體的版本，
// 這支負責讓 App 開啟時悄悄去檢查、下載、套用新版網頁內容，不用每次網頁內容更新都重新上架
// App Store/Google Play。只有原生 App（iOS/Android）才會做這件事，網頁版完全不受影響（網頁版
// 本來就是即時生效，不需要這套機制）。
//
// 自己架設更新伺服器（不用 Capgo 的雲端服務），所以 autoUpdate 設 false、整個流程自己手動驅動，
// 格式完全自訂（見 scripts/build.mjs 的 buildOtaBundle，manifest 就只有 version/url 兩個欄位）。
//
// 運作方式（照 @capgo/capacitor-updater 官方建議的安全模式）：
// - App 在前景使用中：背景下載新版本（下載失敗很常見，例如離線，安靜放棄，下次開啟再試，
//   不會讓使用者看到任何錯誤訊息）
// - App 切到背景（使用者按 Home 鍵、切去別的 App）：這時候才真的套用新版本並重新整理，
//   使用者看不到重新整理的過程，下次回到 App 已經是新版
// - 每次 App 成功開啟，一定要呼叫 notifyAppReady()：這是外掛內建的安全機制，沒呼叫的話外掛
//   會認定這個版本「開不起來」，下次自動回滾到上一個能用的版本（或是原本內建的版本）——
//   等於每次更新都自帶「壞了會自動復原」的保險，不會真的被一個壞版本卡死打不開
const OTA_MANIFEST_URL = "https://aha-trip.github.io/trip-planner/update-manifest.json";
const OTA_VERSION_KEY = "zoula_ota_version";

function initOtaUpdate() {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
  const Updater = window.Capacitor.Plugins.CapacitorUpdater;
  const AppPlugin = window.Capacitor.Plugins.App;
  if (!Updater || !AppPlugin) return;

  Updater.notifyAppReady().catch(function () {});

  let pendingVersion = null;

  function tryDownload() {
    fetch(OTA_MANIFEST_URL, { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (manifest) {
        if (!manifest || !manifest.version || !manifest.url) return;
        const lastApplied = localStorage.getItem(OTA_VERSION_KEY);
        if (manifest.version === lastApplied) return; // 已經是最新版本，不用重複下載
        return Updater.download({ version: manifest.version, url: manifest.url }).then(function (versionInfo) {
          pendingVersion = { info: versionInfo, manifestVersion: manifest.version };
        });
      })
      .catch(function (e) {
        // 離線或連不上，安靜放棄，下次開啟再試，不影響目前使用
        console.warn("檢查更新失敗（不影響目前使用）:", e);
      });
  }

  AppPlugin.addListener("appStateChange", function (state) {
    if (state.isActive) {
      tryDownload();
      return;
    }
    if (!pendingVersion) return;
    const toApply = pendingVersion;
    pendingVersion = null;
    Updater.set(toApply.info)
      .then(function () { localStorage.setItem(OTA_VERSION_KEY, toApply.manifestVersion); })
      .catch(function (e) { console.warn("套用更新失敗:", e); });
  });

  // App 剛開啟時也主動檢查一次，不用等使用者切到背景再回來才第一次檢查
  tryDownload();
}
