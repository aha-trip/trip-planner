// 範本行程庫（F5）：完全沒有資料的人，套用一個現成行程當底，選好出發日就直接產生
// 一趟「獨立」的行程（願望清單 + 每天的排程都先幫你排好），之後想怎麼改都不會影響範本本身。
function TemplatesPage() {
  const auth = useAuth();
  const cloudUid = auth.isGoogle ? auth.user.uid : null;
  const [selected, setSelected] = React.useState(null); // 選中要套用的範本
  const [startDate, setStartDate] = React.useState("");
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState(null);

  function openTemplate(tpl) {
    setSelected(tpl);
    setStartDate("");
    setError(null);
  }

  async function handleApply(e) {
    e.preventDefault();
    if (!selected) return;
    if (!startDate) {
      setError("請選擇出發日期");
      return;
    }
    setApplying(true);
    setError(null);
    try {
      await authReadyPromise;
      const currentUser = usingRealFirebase ? firebase.auth().currentUser : null;
      const endDate = addDays(startDate, selected.days - 1);
      const tripId = generateId(10);
      const now = firebase.firestore.Timestamp.now();

      // 先建立行程本身並等它真的寫入完成，才能接著寫願望清單/行程項目這些子集合：
      // 安全規則對子集合的寫入權限判斷要讀取（get）這份行程文件，如果跟子集合塞進同一個
      // batch 一次送出，規則讀到的會是「送出前」的狀態（這時候行程文件還不存在），
      // 會被直接判定沒有權限、整個 batch 失敗。
      await db.doc("trips/" + tripId).set({
        name: selected.title,
        destination: selected.destination,
        startDate: startDate,
        endDate: endDate,
        approxDays: null,
        lat: null,
        lng: null,
        creatorDeviceId: getDeviceId(),
        creatorUid: currentUser ? currentUser.uid : null,
        accessMode: "link",
        createdAt: now,
      });

      const batch = db.batch();
      selected.items.forEach(function (item) {
        const wishlistId = generateId(16);
        batch.set(db.collection("trips/" + tripId + "/wishlistItems").doc(wishlistId), {
          name: item.name,
          category: item.category,
          address: item.address,
          lat: null,
          lng: null,
          placeId: null,
          photoUrl: null,
          notes: item.notes || "",
          addedBy: "範本：" + selected.title,
          createdAt: now,
        });
        const itineraryId = generateId(16);
        batch.set(db.collection("trips/" + tripId + "/itineraryItems").doc(itineraryId), {
          wishlistItemId: wishlistId,
          date: addDays(startDate, item.day - 1),
          order: item.order * 1000,
          transportMode: "walk",
          durationMinutes: 60,
          travelTimeMinutes: null,
          travelDistanceMeters: null,
          travelTimeSource: "auto",
          arrivalTime: null,
          departureTime: null,
          notes: "",
          createdAt: now,
        });
      });

      await batch.commit();

      const recentFields = {
        name: selected.title,
        destination: selected.destination,
        startDate: startDate,
        endDate: endDate,
        approxDays: null,
      };
      recordRecentTrip(tripId, recentFields);
      if (cloudUid) await saveRecentTripToCloud(cloudUid, tripId, recentFields);

      window.location.hash = "#/trip/" + tripId + "/wishlist";
    } catch (err) {
      console.error(err);
      setError("套用範本失敗，請稍後再試。");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative px-4 py-10">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-200 via-cream to-cream" />
      <div className="w-full max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <a href="#/" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50" aria-label="回首頁" title="回首頁">
            <img src="logo-icon.png" alt="" className="w-9 h-9 object-contain" />
          </a>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <CompassIcon className="w-5 h-5 text-brand-600" /> 範本行程庫
            </h1>
            <p className="text-xs text-slate-500">沒有自己的資料也沒關係，先套一個現成行程，之後再慢慢改</p>
          </div>
        </div>

        <div className="space-y-3">
          {TRIP_TEMPLATES.map(function (tpl) {
            return (
              <button
                key={tpl.id}
                onClick={function () { openTemplate(tpl); }}
                className="w-full text-left bg-white/90 backdrop-blur rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:ring-2 hover:ring-brand-300 transition"
              >
                <div
                  className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: tpl.accent }}
                >
                  {tpl.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 truncate">{tpl.title}</p>
                  <p className="text-xs text-slate-500 truncate">{tpl.destination} · {tpl.days} 天 · {tpl.items.length} 個地點</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center px-4" onClick={function () { if (!applying) setSelected(null); }}>
          <div
            className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-5 space-y-4"
            onClick={function (e) { e.stopPropagation(); }}
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: selected.accent }}>
                {selected.emoji}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800">{selected.title}</p>
                <p className="text-xs text-slate-500">{selected.destination} · {selected.days} 天</p>
              </div>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">出發日期</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={startDate}
                  onChange={function (e) { setStartDate(e.target.value); }}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={function () { setSelected(null); }}
                  disabled={applying}
                  className="flex-1 rounded-lg border border-amber-200 text-slate-600 font-medium py-2.5 transition disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 transition"
                >
                  {applying ? "建立中..." : "套用這個範本"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
