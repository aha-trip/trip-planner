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

  // 離線快取（enablePersistence）先關閉：這個瀏覽器端的 IndexedDB 快取一旦存進一筆
  // 「查不到/沒權限」的舊結果，之後即使規則已經修好、文件明明存在，同一台瀏覽器還是會
  // 一直認定「這份資料不存在」，造成很難排查的「明明在資料庫裡卻讀不到」問題——
  // 這正是目前在排查的那個 bug。跟拿掉 Service Worker 是同樣的取捨：開發階段要的是
  // 「隨時都拿得到最新、最正確的資料」，離線瀏覽先讓路，等功能都穩定了再重新評估要不要加回來。

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

// 稀疏排序值用的小工具：在 a、b 之間插入新項目的 order
function orderBetween(a, b) {
  if (a == null && b == null) return 1000;
  if (a == null) return b - 1000;
  if (b == null) return a + 1000;
  return (a + b) / 2;
}
