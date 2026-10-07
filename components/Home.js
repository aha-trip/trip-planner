const HOME_FEATURE_HIGHLIGHTS = [
  { Icon: HeartListIcon, label: "願望清單" },
  { Icon: CalendarIcon, label: "排行程" },
  { Icon: BagIcon, label: "購物清單" },
];

// 首頁：列出之前建立/打開過的行程，也能建立新行程
function Home() {
  const auth = useAuth();
  const [localTrips] = React.useState(function () { return getRecentTrips(); });
  const cloudUid = auth.isGoogle ? auth.user.uid : null;
  const { data: cloudTrips, loading: cloudLoading } = useCollection(cloudUid ? "users/" + cloudUid + "/trips" : null);
  const recentTrips = mergeRecentTrips(localTrips, cloudTrips);
  const [name, setName] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [dateMode, setDateMode] = React.useState("known"); // "known" | "undecided"
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [approxDays, setApproxDays] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showForm, setShowForm] = React.useState(recentTrips.length === 0);

  // 剛用 Google 登入時，把這台裝置上打開過、但雲端還沒有的行程補上去
  React.useEffect(function () {
    if (!cloudUid || cloudLoading) return;
    const cloudIds = {};
    cloudTrips.forEach(function (t) { cloudIds[t.id] = true; });
    localTrips.forEach(function (t) {
      if (!cloudIds[t.tripId]) saveRecentTripToCloud(cloudUid, t.tripId, t);
    });
  }, [cloudUid, cloudLoading]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("請幫這趟行程取個名字");
      return;
    }
    if (dateMode === "known") {
      if (!startDate || !endDate) {
        setError("請選擇開始和結束日期，或改選「日期還沒定」");
        return;
      }
      if (endDate < startDate) {
        setError("結束日期不能早於開始日期");
        return;
      }
    }

    const parsedApproxDays = parseInt(approxDays, 10);

    setCreating(true);
    setError(null);
    try {
      await authReadyPromise;
      const currentUser = usingRealFirebase ? firebase.auth().currentUser : null;
      const tripId = generateId(10);
      await db.doc("trips/" + tripId).set({
        name: name.trim(),
        destination: destination.trim(),
        startDate: dateMode === "known" ? (startDate || null) : null,
        endDate: dateMode === "known" ? (endDate || null) : null,
        approxDays: dateMode === "undecided" && parsedApproxDays > 0 ? parsedApproxDays : null,
        lat: null,
        lng: null,
        creatorDeviceId: getDeviceId(),
        creatorUid: currentUser ? currentUser.uid : null,
        accessMode: "link",
        createdAt: firebase.firestore.Timestamp.now(),
      });
      recordRecentTrip(tripId, {
        name: name.trim(),
        destination: destination.trim(),
        startDate: dateMode === "known" ? (startDate || null) : null,
        endDate: dateMode === "known" ? (endDate || null) : null,
        approxDays: dateMode === "undecided" && parsedApproxDays > 0 ? parsedApproxDays : null,
      });
      window.location.hash = "#/trip/" + tripId + "/wishlist";
    } catch (err) {
      console.error(err);
      setError("建立行程失敗，請稍後再試。");
    } finally {
      setCreating(false);
    }
  }

  function handleRemoveRecent(tripId) {
    if (!window.confirm("從這份清單移除？（不會刪除行程本身，之後還是可以用連結打開）")) return;
    removeRecentTrip(tripId);
    Promise.resolve(cloudUid ? removeRecentTripFromCloud(cloudUid, tripId) : null).then(function () {
      window.location.reload();
    });
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
            <img src="logo-icon.png" alt="" className="w-9 h-9 object-contain" />
            <h1 className="text-2xl font-bold text-slate-800">ZouLa</h1>
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
                  <TripListItem
                    key={t.tripId}
                    trip={t}
                    onRemove={function () { handleRemoveRecent(t.tripId); }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {recentTrips.length === 0 ? (
          <div className="bg-white/70 rounded-2xl p-5 text-center space-y-3">
            <p className="text-slate-600 text-sm leading-relaxed">
              不用再開十個對話串兜行程<br />一個連結，願望清單、排行程、購物清單一起搞定
            </p>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {HOME_FEATURE_HIGHLIGHTS.map(function (f) {
                return (
                  <div key={f.label} className="bg-white/80 rounded-xl py-2.5 flex flex-col items-center gap-1">
                    <f.Icon className="w-5 h-5 text-brand-600" />
                    <span className="text-[11px] text-slate-600">{f.label}</span>
                  </div>
                );
              })}
            </div>
            <a href="#/demo" className="inline-block text-sm text-brand-600 hover:underline font-medium">
              👀 看範例行程
            </a>
          </div>
        ) : (
          <div className="text-right -mt-2">
            <a href="#/demo" className="text-xs text-slate-400 hover:text-brand-600 hover:underline">
              看範例行程
            </a>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={function () { setDateMode("known"); }}
                    className={
                      "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition " +
                      (dateMode === "known" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                    }
                  >
                    知道確切日期
                  </button>
                  <button
                    type="button"
                    onClick={function () { setDateMode("undecided"); }}
                    className={
                      "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition " +
                      (dateMode === "undecided" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                    }
                  >
                    日期還沒定
                  </button>
                </div>
              </div>

              {dateMode === "known" ? (
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
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">大概幾天？（選填）</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    value={approxDays}
                    onChange={function (e) { setApproxDays(e.target.value); }}
                    placeholder="例如：5"
                  />
                  <p className="text-xs text-slate-400 mt-1">之後把地點排進「行程」某一天時，再選實際日期就好</p>
                </div>
              )}

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
