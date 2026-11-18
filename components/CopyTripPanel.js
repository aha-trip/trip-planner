// 複製朋友的行程（F9）：原作者把「允許別人複製」打開後，任何打開分享連結的人都能看到這個入口，
// 選一個新的出發日期就能把願望清單 + 每天的行程複製成一份「獨立」的新行程，之後想怎麼改都不會
// 影響到原本那趟。故意不複製：花費、行李清單、私人購物截圖、保管箱內容、成員名單——這些是原本
// 那群人的私人資料，複製的人不需要也不該看到。
//
// 連帶做掉 F10 的精神（讓使用者在複製的當下就感受到「行前任務雷達」的價值）：預覽清單裡每個
// 跟現有雷達規則命中的地點，直接標「需要預約」，不用等複製完才在準備頁面才發現。
function CopyTripPanel({ tripId, trip, onClose }) {
  const auth = useAuth();
  const cloudUid = auth.isGoogle ? auth.user.uid : null;
  const { nickname: localNickname } = useLocalIdentity();
  const nickname = auth.isGoogle ? auth.user.displayName : localNickname;

  const { data: rawWishlist, loading: loadingWishlist } = useCollection("trips/" + tripId + "/wishlistItems");
  const { data: rawItinerary, loading: loadingItinerary } = useCollection("trips/" + tripId + "/itineraryItems");
  const [startDate, setStartDate] = React.useState("");
  const [copying, setCopying] = React.useState(false);
  const [error, setError] = React.useState(null);

  const loading = loadingWishlist || loadingItinerary;
  const wishlist = rawWishlist.filter(function (i) { return !i.deletedAt; });
  const itinerary = rawItinerary.filter(function (i) { return !i.deletedAt; });
  const wishlistById = {};
  wishlist.forEach(function (w) { wishlistById[w.id] = w; });

  // 這趟行程「日期還沒定」時沒有 startDate，退而求其次用已排進行程裡最早的那天當基準，
  // 複製時才能算出每個項目原本是「出發後第幾天」，換算到新的出發日期上
  const baseDate = trip.startDate || itinerary.map(function (i) { return i.date; }).sort()[0] || null;

  const dayOffsetsByItineraryId = {};
  let maxOffset = 0;
  itinerary.forEach(function (i) {
    const offset = baseDate ? diffDaysInt(baseDate, i.date) : 0;
    dayOffsetsByItineraryId[i.id] = offset;
    if (offset > maxOffset) maxOffset = offset;
  });

  // 依「出發後第幾天」分組預覽，沒有被排進行程的願望清單項目歸到最後一組「還沒排進行程」
  const scheduledWishlistIds = {};
  const dayGroups = {};
  itinerary.forEach(function (i) {
    const w = wishlistById[i.wishlistItemId];
    if (!w) return;
    scheduledWishlistIds[w.id] = true;
    const offset = dayOffsetsByItineraryId[i.id];
    if (!dayGroups[offset]) dayGroups[offset] = [];
    dayGroups[offset].push(w);
  });
  const sortedOffsets = Object.keys(dayGroups).map(Number).sort(function (a, b) { return a - b; });
  const unscheduled = wishlist.filter(function (w) { return !scheduledWishlistIds[w.id]; });

  function bookingHint(name) {
    return matchBookingRule(name);
  }

  async function handleCopy(e) {
    e.preventDefault();
    if (!startDate) {
      setError("請選擇出發日期");
      return;
    }
    setCopying(true);
    setError(null);
    try {
      await authReadyPromise;
      const currentUser = usingRealFirebase ? firebase.auth().currentUser : null;
      const now = firebase.firestore.Timestamp.now();
      const newTripId = generateId(10);

      const durationDays = trip.startDate && trip.endDate
        ? diffDaysInt(trip.startDate, trip.endDate) + 1
        : (itinerary.length > 0 ? maxOffset + 1 : null);
      const endDate = durationDays ? addDays(startDate, durationDays - 1) : null;

      // 先建立新行程本身並等它真的寫入完成，才能接著寫願望清單/行程項目這些子集合：
      // 安全規則要讀取這份行程文件才能判斷子集合有沒有寫入權限，塞進同一個 batch 一次送出
      // 會因為規則讀到「送出前、行程文件還不存在」的狀態而整批被拒絕。
      await db.doc("trips/" + newTripId).set({
        name: trip.name + "（複製）",
        destination: trip.destination || "",
        startDate: startDate,
        endDate: endDate,
        approxDays: !durationDays ? (trip.approxDays || null) : null,
        lat: null,
        lng: null,
        creatorDeviceId: getDeviceId(),
        creatorUid: currentUser ? currentUser.uid : null,
        accessMode: "link",
        allowCopy: true,
        copiedFrom: tripId,
        createdAt: now,
      });

      // Firestore 一個 batch 最多 500 次寫入，這裡每個地點會寫 2 筆（願望清單 + 行程項目），
      // 保守切成每批 200 個地點（最多 400 筆寫入）分批送出，避免行程很大時超過限制。
      const CHUNK_SIZE = 200;
      for (let start = 0; start < wishlist.length; start += CHUNK_SIZE) {
        const chunk = wishlist.slice(start, start + CHUNK_SIZE);
        const batch = db.batch();
        chunk.forEach(function (w) {
          const newWishlistId = generateId(16);
          batch.set(db.collection("trips/" + newTripId + "/wishlistItems").doc(newWishlistId), {
            name: w.name,
            category: w.category,
            address: w.address || "",
            lat: w.lat != null ? w.lat : null,
            lng: w.lng != null ? w.lng : null,
            placeId: w.placeId || null,
            photoUrl: null, // 購物清單截圖等私人內容不帶過去，地點照片也不複製，避免跨行程誤用到別人的圖床額度
            notes: w.notes || "",
            addedBy: nickname ? nickname + "（複製自「" + trip.name + "」）" : "複製自「" + trip.name + "」",
            createdAt: now,
          });

          const matchingItinerary = itinerary.filter(function (i) { return i.wishlistItemId === w.id; });
          matchingItinerary.forEach(function (srcItem) {
            const offset = dayOffsetsByItineraryId[srcItem.id];
            batch.set(db.collection("trips/" + newTripId + "/itineraryItems").doc(generateId(16)), {
              wishlistItemId: newWishlistId,
              date: addDays(startDate, offset),
              order: srcItem.order,
              transportMode: srcItem.transportMode || "walk",
              durationMinutes: srcItem.durationMinutes || 60,
              travelTimeMinutes: null,
              travelDistanceMeters: null,
              travelTimeSource: "auto",
              arrivalTime: null,
              departureTime: null,
              notes: "",
              createdAt: now,
            });
          });
        });
        await batch.commit();
      }

      const recentFields = {
        name: trip.name + "（複製）",
        destination: trip.destination || "",
        startDate: startDate,
        endDate: endDate,
        approxDays: !durationDays ? (trip.approxDays || null) : null,
      };
      recordRecentTrip(newTripId, recentFields);
      if (cloudUid) await saveRecentTripToCloud(cloudUid, newTripId, recentFields);

      window.location.hash = "#/trip/" + newTripId + "/wishlist";
    } catch (err) {
      console.error(err);
      setError("複製失敗，請稍後再試。");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center sm:px-4" onClick={function () { if (!copying) onClose(); }}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="p-5 pb-3 shrink-0 flex items-center justify-between border-b border-amber-100">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CopyIcon className="w-4 h-4 text-brand-600" /> 複製這趟行程
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">會複製願望清單跟每天的行程，變成一份你自己的獨立行程</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 w-8 h-8 flex items-center justify-center" aria-label="關閉">✕</button>
        </div>

        <div className="px-5 py-3 overflow-y-auto grow space-y-3">
          {loading && <p className="text-slate-400 text-sm">載入中...</p>}
          {!loading && wishlist.length === 0 && (
            <p className="text-slate-400 text-sm">這趟行程目前還沒有任何地點可以複製。</p>
          )}
          {!loading && sortedOffsets.map(function (offset) {
            return (
              <div key={offset}>
                <p className="text-xs font-bold text-brand-700 mb-1">出發後第 {offset + 1} 天</p>
                <div className="space-y-1">
                  {dayGroups[offset].map(function (w) {
                    const rule = bookingHint(w.name);
                    return (
                      <div key={w.id} className="bg-amber-50/60 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                        <span className="shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white text-brand-700 border border-brand-100">
                          {CATEGORY_LABELS[w.category]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                        </div>
                        {rule && (
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                            <HourglassIcon className="w-3 h-3" /> 需要預約
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!loading && unscheduled.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">還沒排進行程</p>
              <div className="space-y-1">
                {unscheduled.map(function (w) {
                  const rule = bookingHint(w.name);
                  return (
                    <div key={w.id} className="bg-amber-50/60 rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                      <span className="shrink-0 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white text-brand-700 border border-brand-100">
                        {CATEGORY_LABELS[w.category]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                      </div>
                      {rule && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <HourglassIcon className="w-3 h-3" /> 需要預約
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleCopy} className="p-5 pt-3 shrink-0 border-t border-amber-100 space-y-3">
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
              onClick={onClose}
              disabled={copying}
              className="flex-1 rounded-lg border border-amber-200 text-slate-600 font-medium py-2.5 transition disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={copying || loading}
              className="flex-1 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 transition"
            >
              {copying ? "複製中..." : "複製成我的行程"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
