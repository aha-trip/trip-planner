// 讓 App 自己的檔案（HTML/CSS/JS）離線也能開起來。
// 策略：先試網路拿最新版本，拿得到就順便存一份快取、也回傳給頁面；拿不到（離線）才用上次
// 存的快取頂替。Firestore 真正的資料同步是另一套機制（見 firebase.js 的 enablePersistence），
// 這裡不碰。
//
// 只攔截「自己網站」的請求，CDN／Google 登入／Firebase 等跨網域的請求完全不插手直接放行——
// 之前版本攔截了所有網域，結果連 Google 登入用的 accounts.google.com 腳本也被攔截處理，
// 任何一點差錯都可能讓那個請求失敗，導致 Google 登入退回舊版（在 GitHub Pages 這種網域下
// 很容易出現「missing initial state」之類的登入失敗）。改成只管自己的檔案就沒有這個風險。
const CACHE_NAME = "travel-app-shell-v2";

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
  if (new URL(req.url).origin !== self.location.origin) return; // 只管自己網站的檔案

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); }).catch(function () {});
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
