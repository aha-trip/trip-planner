// 「分享給別人看」的獨立唯讀頁面（不透過 TripLayout）：單純想把行程秀給朋友看、
// 讓對方決定要不要複製一份自己用，不等於邀請對方加入一起編輯。
//
// 跟 TripLayout 的差別很關鍵：這裡完全不會跑 NicknamePrompt／寫入 members 子集合那些
// 「加入這趟行程」才會做的事，單純打開連結看一看，不會意外變成這趟行程的成員。
// 真的想一起編輯的人，畫面下方有另一個按鈕可以點過去。
function TripSharePreview({ tripId }) {
  const { data: trip, loading } = useDocument("trips/" + tripId);
  const { data: rawWishlist, loading: loadingWishlist } = useCollection("trips/" + tripId + "/wishlistItems");
  const { data: rawItinerary, loading: loadingItinerary } = useCollection("trips/" + tripId + "/itineraryItems");
  const [showCopyTrip, setShowCopyTrip] = React.useState(false);

  if (loading || loadingWishlist || loadingItinerary) {
    return (
      <div className="min-h-screen relative flex items-center justify-center text-slate-400">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
        載入中...
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
        <div className="max-w-md rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4">
          找不到這趟行程，連結可能有誤。
        </div>
      </div>
    );
  }

  const wishlist = rawWishlist.filter(function (w) { return !w.deletedAt; });
  const itinerary = rawItinerary.filter(function (i) { return !i.deletedAt; });
  const wishlistById = {};
  wishlist.forEach(function (w) { wishlistById[w.id] = w; });
  const dayList = getTripDayList(trip, itinerary);

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />

      <header className="bg-cream/60 backdrop-blur border-b-2 border-brand-200/70 sticky top-0 z-10">
        <div className="bg-amber-50 text-amber-800 text-xs text-center py-1 px-2 flex items-center justify-center gap-1">
          <EyeIcon className="w-3.5 h-3.5 shrink-0" /> 這是唯讀預覽，單純看看而已，不會動到這趟行程的內容
        </div>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <a href="#/" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50" aria-label="回首頁" title="回首頁">
              <img src="logo-icon.png" alt="" className="w-9 h-9 object-contain" />
            </a>
            <h1 className="text-base font-bold text-slate-800 truncate">
              {trip.name}{trip.destination && <span> · {trip.destination}</span>}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-28">
        {trip.startDate && trip.endDate && (
          <p className="text-sm text-slate-500">{trip.startDate} ～ {trip.endDate}</p>
        )}

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <HeartListIcon className="w-5 h-5 text-brand-600" /> 願望清單（{wishlist.length}）
          </h2>
          {wishlist.length === 0 ? (
            <p className="text-slate-400 text-sm">還沒有任何地點。</p>
          ) : (
            <div className="space-y-2">
              {wishlist.map(function (w) {
                const rule = matchBookingRule(w.name);
                return (
                  <div key={w.id} className="bg-white rounded-xl border border-amber-100 px-3 py-2.5 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                      {CATEGORY_LABELS[w.category]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">{w.name}</p>
                      {w.address && <p className="text-xs text-slate-500 truncate">{w.address}</p>}
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
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <CalendarIcon className="w-5 h-5 text-brand-600" /> 行程
          </h2>
          {dayList.length === 0 ? (
            <p className="text-slate-400 text-sm">還沒有排進每天的行程。</p>
          ) : (
            <div className="space-y-4">
              {dayList.map(function (date, index) {
                const dayItems = itinerary
                  .filter(function (i) { return i.date === date; })
                  .sort(function (a, b) { return a.order - b.order; });
                return (
                  <div key={date}>
                    <p className="text-sm font-bold text-brand-700 mb-1.5">Day {index + 1} · {date}</p>
                    {dayItems.length === 0 ? (
                      <p className="text-xs text-slate-400">這天還沒有安排</p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayItems.map(function (item) {
                          const w = wishlistById[item.wishlistItemId];
                          if (!w) return null;
                          return (
                            <div key={item.id} className="bg-white rounded-lg border border-amber-100 px-3 py-2 flex items-center gap-3">
                              <span className="shrink-0 text-xs font-mono text-slate-400 w-10">{item.arrivalTime || "--:--"}</span>
                              <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 truncate">{w.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-amber-100 px-4 py-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {trip.allowCopy ? (
            <button
              type="button"
              onClick={function () { setShowCopyTrip(true); }}
              className="flex-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 transition flex items-center justify-center gap-1.5"
            >
              <CopyIcon className="w-4 h-4" /> 複製成我的行程
            </button>
          ) : (
            <p className="flex-1 text-xs text-slate-400 text-center">這趟行程還沒開放複製</p>
          )}
          <a
            href={"#/trip/" + tripId + "/wishlist"}
            className="shrink-0 rounded-lg border border-amber-200 text-brand-700 text-sm font-medium px-3 py-2.5 transition hover:border-brand-400"
          >
            我要加入一起編輯
          </a>
        </div>
      </div>

      {showCopyTrip && (
        <CopyTripPanel tripId={tripId} trip={trip} onClose={function () { setShowCopyTrip(false); }} />
      )}
    </div>
  );
}
