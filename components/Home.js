// 首頁：列出之前建立/打開過的行程，也能建立新行程
function Home() {
  const [recentTrips] = React.useState(function () { return getRecentTrips(); });
  const [name, setName] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showForm, setShowForm] = React.useState(recentTrips.length === 0);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("請幫這趟行程取個名字");
      return;
    }
    if (!startDate || !endDate) {
      setError("請選擇開始和結束日期，行程需要有日期才能排每天的安排");
      return;
    }
    if (endDate < startDate) {
      setError("結束日期不能早於開始日期");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await authReadyPromise;
      const currentUser = usingRealFirebase ? firebase.auth().currentUser : null;
      const tripId = generateId(10);
      await db.doc("trips/" + tripId).set({
        name: name.trim(),
        destination: destination.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        lat: null,
        lng: null,
        creatorDeviceId: getDeviceId(),
        creatorUid: currentUser ? currentUser.uid : null,
        accessMode: "link",
        createdAt: firebase.firestore.Timestamp.now(),
      });
      recordRecentTrip(tripId, { name: name.trim(), destination: destination.trim() });
      window.location.hash = "#/trip/" + tripId + "/wishlist";
    } catch (err) {
      console.error(err);
      setError("建立行程失敗，請稍後再試。");
    } finally {
      setCreating(false);
    }
  }

  function handleRemoveRecent(e, tripId) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("從這份清單移除？（不會刪除行程本身，之後還是可以用連結打開）")) return;
    removeRecentTrip(tripId);
    window.location.reload();
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative flex items-start justify-center px-4 py-10">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-200 via-cream to-cream" />
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end gap-2">
          <AccountButton />
          <FontSizeButton />
        </div>
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <LogoIcon className="w-9 h-9" />
            <h1 className="text-2xl font-bold text-slate-800">旅遊規劃</h1>
          </div>
          <p className="text-slate-500 text-sm">建立一趟行程，把連結分享給大家一起編輯</p>
        </div>

        {usingLocalBackend && (
          <div className="rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-sm p-3">
            🧪 目前是本機試玩模式：資料只存在這個瀏覽器，還不會跟別人同步。想多人共享時，照
            <code className="font-mono mx-1">SETUP.md</code>設定 Firebase 即可自動切換。
          </div>
        )}

        {recentTrips.length > 0 && (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 mb-3">📂 你打開過的行程</h2>
            <div className="space-y-2">
              {recentTrips.map(function (t) {
                return (
                  <a
                    key={t.tripId}
                    href={"#/trip/" + t.tripId + "/wishlist"}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 hover:border-brand-400 px-3 py-2 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                      {t.destination && <p className="text-xs text-slate-400 truncate">{t.destination}</p>}
                    </div>
                    <button
                      onClick={function (e) { handleRemoveRecent(e, t.tripId); }}
                      className="shrink-0 text-xs text-slate-300 hover:text-red-500"
                      title="從清單移除"
                    >
                      ✕
                    </button>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {!showForm ? (
          <button
            onClick={function () { setShowForm(true); }}
            className="w-full rounded-lg border-2 border-dashed border-amber-300 text-brand-600 hover:border-brand-400 font-medium py-3 transition bg-white/60"
          >
            ＋ 建立新行程
          </button>
        ) : (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">行程名稱</label>
                <input
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={name}
                  onChange={function (e) { setName(e.target.value); }}
                  placeholder="例如：東京五日遊"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">目的地</label>
                <input
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={destination}
                  onChange={function (e) { setDestination(e.target.value); }}
                  placeholder="例如：日本東京"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">開始日期 *</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    value={startDate}
                    onChange={function (e) { setStartDate(e.target.value); }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">結束日期 *</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    value={endDate}
                    onChange={function (e) { setEndDate(e.target.value); }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 -mt-2">* 要先設定天數，願望清單裡的項目才能排進「第幾天」</p>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 transition"
              >
                {creating ? "建立中..." : "建立行程"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
