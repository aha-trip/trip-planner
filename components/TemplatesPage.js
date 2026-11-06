// 範本行程庫（F5）：完全沒有資料的人，套用一個現成行程當底，選好出發日就直接產生
// 一趟「獨立」的行程（願望清單 + 每天的排程都先幫你排好），之後想怎麼改都不會影響範本本身。
function TemplatesPage() {
  const auth = useAuth();
  const cloudUid = auth.isGoogle ? auth.user.uid : null;
  const [selected, setSelected] = React.useState(null); // 選中要預覽/套用的範本
  const [days, setDays] = React.useState(1); // 使用者可以調整的天數，預設跟範本一樣
  const [startDate, setStartDate] = React.useState("");
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState(null);

  function openTemplate(tpl) {
    setSelected(tpl);
    setDays(tpl.days);
    setStartDate("");
    setError(null);
  }

  function changeDays(delta) {
    setDays(function (d) { return Math.min(30, Math.max(1, d + delta)); });
  }

  // 依目前調整後的天數分組預覽：天數減少時，超過範圍的地點不會被加入（下面會提示使用者）
  const previewDays = selected
    ? Array.from({ length: days }, function (_, i) {
        const dayNum = i + 1;
        return { dayNum: dayNum, items: selected.items.filter(function (it) { return it.day === dayNum; }) };
      })
    : [];
  const droppedCount = selected ? selected.items.filter(function (it) { return it.day > days; }).length : 0;

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
      const itemsToApply = selected.items.filter(function (it) { return it.day <= days; });
      const endDate = addDays(startDate, days - 1);
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
      itemsToApply.forEach(function (item) {
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
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end sm:items-center justify-center sm:px-4" onClick={function () { if (!applying) setSelected(null); }}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
            onClick={function (e) { e.stopPropagation(); }}
          >
            <div className="p-5 pb-3 shrink-0 flex items-center gap-3 border-b border-amber-100">
              <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: selected.accent }}>
                {selected.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800">{selected.title}</p>
                <p className="text-xs text-slate-500">{selected.destination} · 原本 {selected.days} 天 · {selected.items.length} 個地點</p>
              </div>
            </div>

            <div className="px-5 py-3 shrink-0 flex items-center justify-between border-b border-amber-100">
              <span className="text-sm font-medium text-slate-700">天數</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={function () { changeDays(-1); }}
                  disabled={days <= 1}
                  className="w-8 h-8 rounded-full border border-amber-200 text-brand-700 font-bold disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-800">{days} 天</span>
                <button
                  type="button"
                  onClick={function () { changeDays(1); }}
                  disabled={days >= 30}
                  className="w-8 h-8 rounded-full border border-amber-200 text-brand-700 font-bold disabled:opacity-30"
                >
                  ＋
                </button>
              </div>
            </div>

            <div className="px-5 py-3 overflow-y-auto grow space-y-3">
              {droppedCount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  天數比範本原本的少，後面 {droppedCount} 個地點不會被加進來（可以之後再增加天數）
                </p>
              )}
              {previewDays.map(function (d) {
                return (
                  <div key={d.dayNum}>
                    <p className="text-xs font-bold text-brand-700 mb-1">Day {d.dayNum}</p>
                    {d.items.length === 0 ? (
                      <p className="text-xs text-slate-400 pl-1">這天還沒安排，套用後可以自己加地點</p>
                    ) : (
                      <div className="space-y-1">
                        {d.items.map(function (item, i) {
                          return (
                            <div key={i} className="bg-amber-50/60 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                              <span className="shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white text-brand-700 border border-brand-100">
                                {CATEGORY_LABELS[item.category]}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                {item.notes && <p className="text-xs text-slate-500 truncate">{item.notes}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleApply} className="p-5 pt-3 shrink-0 border-t border-amber-100 space-y-3">
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
