// 標題列的帳號按鈕：沒登入時顯示「Google 登入」，登入後顯示頭像，點一下可登出。
// 本機試玩模式沒有帳號系統，整個不顯示。
function AccountButton() {
  const { user, isGoogle } = useAuth();
  if (!usingRealFirebase) return null;

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      const msg = describeAuthError(err);
      if (msg) window.alert(msg);
    }
  }

  function handleSignOut() {
    if (!window.confirm("登出「" + user.displayName + "」？（登出後回到匿名身分）")) return;
    signOutUser();
  }

  if (isGoogle) {
    return (
      <button
        onClick={handleSignOut}
        title={"已用 Google 登入：" + user.displayName + "（點一下登出）"}
        aria-label="登出"
        className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-amber-200 bg-white hover:border-brand-400 overflow-hidden text-sm font-bold text-brand-700"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : (
          (user.displayName || "?").charAt(0).toUpperCase()
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="shrink-0 rounded-full border border-amber-200 bg-white hover:border-brand-400 text-slate-600 text-xs font-medium px-3 h-10"
    >
      Google 登入
    </button>
  );
}
