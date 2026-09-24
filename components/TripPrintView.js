// 簡化的純文字行程總覽，方便出國當天網路不穩時直接列印或存成 PDF、截圖離線查看
function TripPrintView({ tripId }) {
  const { data: trip, loading } = useDocument("trips/" + tripId);
  const { data: rawItineraryItems } = useCollection("trips/" + tripId + "/itineraryItems");
  const { data: rawWishlistItems } = useCollection("trips/" + tripId + "/wishlistItems");

  const itineraryItems = rawItineraryItems.filter(function (i) { return !i.deletedAt; });
  const wishlistById = {};
  rawWishlistItems
    .filter(function (w) { return !w.deletedAt; })
    .forEach(function (w) { wishlistById[w.id] = w; });
  const dayList = getTripDayList(trip, itineraryItems);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">載入中...</div>;
  }
  if (!trip) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">找不到這趟行程</div>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-2xl mx-auto p-6 print:p-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <a href={"#/trip/" + tripId + "/itinerary"} className="text-sm text-brand-600 hover:underline">← 回行程</a>
          <button
            onClick={function () { window.print(); }}
            className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5"
          >
            列印／存成 PDF
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-1">{trip.name}</h1>
        {trip.destination && <p className="text-slate-500 mb-1">{trip.destination}</p>}
        {trip.startDate && trip.endDate && (
          <p className="text-slate-500 mb-6">{trip.startDate} ～ {trip.endDate}</p>
        )}

        {dayList.length === 0 && <p className="text-slate-400">還沒有安排行程。</p>}

        {dayList.map(function (date, index) {
          const dayItems = itineraryItems
            .filter(function (i) { return i.date === date; })
            .sort(function (a, b) { return a.order - b.order; });

          return (
            <div key={date} className="mb-6" style={{ breakInside: "avoid" }}>
              <h2 className="text-lg font-bold border-b border-slate-300 pb-1 mb-2">
                Day {index + 1} · {date}
              </h2>
              {dayItems.length === 0 ? (
                <p className="text-sm text-slate-400">這天還沒有安排</p>
              ) : (
                <ol className="space-y-2">
                  {dayItems.map(function (item) {
                    const w = wishlistById[item.wishlistItemId];
                    if (!w) return null;
                    return (
                      <li key={item.id} className="text-sm">
                        <span className="font-semibold">{item.arrivalTime || "--:--"}</span>
                        {" - " + w.name}
                        {w.address && <span className="text-slate-500">（{w.address}）</span>}
                        {item.transportMode && item.transportMode !== "walk" && (
                          <span className="text-slate-500">　交通：{TRANSPORT_LABELS[item.transportMode]}</span>
                        )}
                        {item.notes && <div className="text-slate-500 pl-4">備註：{item.notes}</div>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
