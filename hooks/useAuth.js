// Google 登入狀態。沒有登入時是「匿名身分」（有連結就能編輯的行程用這個），
// 用 Google 登入後 isGoogle 為 true。本機試玩模式沒有帳號系統，一律回傳未登入。
const authSubscribers = [];

function authSnapshot() {
  if (!usingRealFirebase) return null;
  const u = firebase.auth().currentUser;
  if (!u) return null;
  // 每次回傳新物件，這樣「匿名帳號升級成 Google」(uid 不變) 也能觸發重新渲染
  return {
    uid: u.uid,
    isAnonymous: u.isAnonymous,
    displayName: u.displayName || u.email || "",
    photoURL: u.photoURL || "",
  };
}

function notifyAuthSubscribers() {
  const snap = authSnapshot();
  authSubscribers.slice().forEach(function (fn) { fn(snap); });
}

if (usingRealFirebase) {
  firebase.auth().onAuthStateChanged(notifyAuthSubscribers);
}

async function signInWithGoogle() {
  if (!usingRealFirebase) throw new Error("本機試玩模式沒有 Google 登入");
  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();
  const current = auth.currentUser;
  try {
    if (current && current.isAnonymous) {
      // 把目前的匿名身分升級成 Google 帳號：uid 不變，之前的建立者身分和資料都保留
      await current.linkWithPopup(provider);
    } else {
      await auth.signInWithPopup(provider);
    }
  } catch (err) {
    if (err.code === "auth/credential-already-in-use" && err.credential) {
      // 這個 Google 帳號以前登入過（換裝置的情況）：直接切換到那個帳號
      await auth.signInWithCredential(err.credential);
    } else {
      throw err;
    }
  }
  // Firestore 規則靠 token 裡的登入方式判斷，升級後要強制換一張新的
  await auth.currentUser.getIdToken(true);
  notifyAuthSubscribers();
}

function signOutUser() {
  return firebase.auth().signOut();
}

function useAuth() {
  const [user, setUser] = React.useState(authSnapshot);

  React.useEffect(function () {
    authSubscribers.push(setUser);
    setUser(authSnapshot());
    return function () {
      const idx = authSubscribers.indexOf(setUser);
      if (idx >= 0) authSubscribers.splice(idx, 1);
    };
  }, []);

  return { user: user, isGoogle: Boolean(user) && !user.isAnonymous };
}

// 登入失敗時給使用者看的提示（使用者自己關掉視窗不算錯誤）
function describeAuthError(err) {
  const code = err && err.code;
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
  if (code === "auth/popup-blocked") return "瀏覽器擋掉了登入視窗，請允許這個網站的彈出視窗後再試一次。";
  if (code === "auth/unauthorized-domain") return "這個網址還沒加進 Firebase 的「授權網域」，請照 SETUP.md 設定。";
  if (code === "auth/operation-not-allowed") return "Firebase 還沒啟用 Google 登入，請照 SETUP.md 設定。";
  return "登入失敗，請稍後再試。";
}
