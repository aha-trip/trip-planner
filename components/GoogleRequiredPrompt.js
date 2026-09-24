// 建立者把行程設成「只有 Google 登入的人能編輯」時，沒登入的人會看到這個提示
function GoogleRequiredPrompt({ onDismiss }) {
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">這趟行程需要 Google 登入</h2>
        <p className="text-sm text-slate-500 mb-4">建立者設定了只有 Google 登入的人才能編輯。登入後就能一起規劃。</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2 transition"
        >
          {busy ? "登入中..." : "用 Google 登入"}
        </button>
        <button
          onClick={onDismiss}
          className="w-full mt-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 py-2"
        >
          先瀏覽就好（無法編輯）
        </button>
      </div>
    </div>
  );
}
