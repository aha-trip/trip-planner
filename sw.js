// 讓 App 的介面（HTML/CSS/JS，包含 CDN 上的 React、Firebase、MapLibre 等）離線也能開起來。
// 策略：先試網路拿最新版本，拿得到就順便存一份快取、也回傳給頁面；拿不到（離線）才用上次
// 存的快取頂替。Firestore 真正的資料同步是另一套機制（見 firebase.js 的 enablePersistence），
// 這裡不碰，只負責讓「App 殼」本身開得起來。
const CACHE_NAME = "travel-app-shell-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return; // 只快取讀取，寫入一律走原本的網路請求

  const url = req.url;
  // Firestore/Auth 的即時連線自己有離線機制，不要讓 Service Worker 插手，避免干擾同步
  if (
    url.indexOf("firestore.googleapis.com") >= 0 ||
    url.indexOf("identitytoolkit.googleapis.com") >= 0 ||
    url.indexOf("securetoken.googleapis.com") >= 0
  ) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(function (res) {
        //跨網域載入的 CDN script 常常是「不透明回應」(opaque, status 0)，一樣要能快取，
        // 只是沒辦法檢查內容是否正確，所以連同一般的 200 回應都存
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || Promise.reject(new Error("離線，且沒有可用的快取"));
        });
      })
  );
});
