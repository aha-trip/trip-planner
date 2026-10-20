// 初始化資料後端。
// 有填 config.js 的 Firebase 設定時，用真正的 Firebase(compat SDK)做資料同步(Firestore)，可以多人即時同步；
// 沒填的話自動退回本機試玩模式（見 lib/localBackend.js），資料只存在這個瀏覽器，但介面操作完全一樣。
//
// 圖片(購物清單截圖)存放另外選：
//   1. 有填 Cloudinary 設定 -> 用 Cloudinary（免信用卡，見 lib/cloudinaryStorage.js）
//   2. 沒填 Cloudinary 但有真正的 Firebase -> 用 Firebase Storage（需要 Blaze 方案）
//   3. 都沒有 -> 本機模式，圖片轉成 base64 存在瀏覽器裡

const usingRealFirebase = Boolean(CONFIG.firebase.apiKey && CONFIG.firebase.projectId);
const usingLocalBackend = !usingRealFirebase;
const usingCloudinary = Boolean(CONFIG.cloudinary.cloudName && CONFIG.cloudinary.uploadPreset);
const firebaseEnabled = true; // 一定有一個能用的後端（真的 Firebase 或本機模擬版）

let db = null;
let storage = null;
let authReadyPromise = Promise.resolve(null);

if (usingRealFirebase) {
  firebase.initializeApp(CONFIG.firebase);
  db = firebase.firestore();

  // 離線快取（enablePersistence）：之前關掉是因為這個瀏覽器端的 IndexedDB 快取一旦存進一筆
  // 「查不到/沒權限」的舊結果，之後即使規則已經修好、文件明明存在，同一台瀏覽器還是會一直
  // 認定「這份資料不存在」。真正的解法不是整個關掉快取（那樣離線就完全打不開 App），而是：
  // 讀到「不存在」而且這筆結果是從本機快取來的（不是剛跟伺服器確認過），不要直接相信，
  // 強制再跟伺服器核對一次——這段邏輯在 hooks/useCollection.js 的 useDocument 裡。
  // synchronizeTabs 讓同一個瀏覽器開好幾個分頁時能共用這份快取，不會互搶。
  db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
    // 常見原因：無痕視窗、瀏覽器不支援 IndexedDB——離線快取就是加分項，失敗不影響 App 正常運作
    console.warn("無法啟用離線快取（不影響正常使用）:", err && err.code);
  });

  // 匿名登入偶爾會因為網路不穩失敗一次，失敗就直接放棄的話，之後所有讀取都會被規則擋掉
  // （看起來就像「這趟行程不存在」，其實只是沒登入），所以失敗要重試幾次再放棄。
  function signInAnonymouslyWithRetry(attemptsLeft) {
    return firebase.auth().signInAnonymously().catch((err) => {
      if (attemptsLeft <= 0) {
        console.error("匿名登入失敗（已重試多次）:", err);
        throw err;
      }
      return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
        signInAnonymouslyWithRetry(attemptsLeft - 1)
      );
    });
  }

  // 監聽器一直留著：沒有登入身分（第一次進來、或按了 Google 登出）就自動退回匿名登入，
  // 這樣「有連結就能編輯」的行程任何時候都能用。
  authReadyPromise = new Promise((resolve) => {
    let resolved = false;
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        if (!resolved) {
          resolved = true;
          resolve(user);
        }
      } else {
        signInAnonymouslyWithRetry(3).catch(() => {
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
        });
      }
    });
  });
} else {
  db = createLocalDb();
}

if (usingCloudinary) {
  storage = createCloudinaryStorage();
} else if (usingRealFirebase) {
  storage = firebase.storage();
} else {
  storage = createLocalStorageBackend();
}

// 萬一離線快取真的壞掉（理論上有上面那段核對伺服器的邏輯擋著，不該發生，但留一個救援手段），
// 讓使用者自己能修復，不用教他清瀏覽器資料。放在 HeaderMenu／BottomNav 的「更多」選單裡。
function clearFirestoreCacheAndReload() {
  if (!usingRealFirebase) { window.location.reload(); return Promise.resolve(); }
  return db.terminate()
    .then(function () { return db.clearPersistence(); })
    .catch(function (err) { console.error("清除本機快取失敗:", err); })
    .then(function () { window.location.reload(); });
}

// 稀疏排序值用的小工具：在 a、b 之間插入新項目的 order
function orderBetween(a, b) {
  if (a == null && b == null) return 1000;
  if (a == null) return b - 1000;
  if (b == null) return a + 1000;
  return (a + b) / 2;
}
