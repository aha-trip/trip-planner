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
        firebase.auth().signInAnonymously().catch((err) => {
          console.error("匿名登入失敗:", err);
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
