// 第一次進入行程時要求輸入暱稱（只是用來標示「誰新增的」），也可以改用 Google 登入，登入後就不用再輸入暱稱
function NicknamePrompt({ onSubmit }) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState(null);

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError(describeAuthError(err));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-1">你的暱稱？</h2>
        <p className="text-sm text-slate-500 mb-4">讓大家知道是誰新增了這個行程項目</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={value}
            onChange={function (e) { setValue(e.target.value); }}
            placeholder="例如：小明"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 transition"
          >
            開始規劃
          </button>
        </form>
        {usingRealFirebase && (
          <div className="mt-3 pt-3 border-t border-amber-100">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full rounded-lg border border-amber-200 hover:border-brand-400 text-slate-700 text-sm font-medium py-2 transition"
            >
              或用 Google 登入（換裝置也保有身分）
            </button>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
