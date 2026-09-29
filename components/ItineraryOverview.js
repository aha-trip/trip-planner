// 多天行程總覽：把每一天排成一張卡片一次捲動看完，方便看出哪幾天太滿、哪幾天還空著。
// 只是摘要，不是可編輯的完整卡片；點項目或「查看/編輯這天」會切回單日檢視。
function ItineraryOverview({ tripId, dayList, itineraryItems, wishlistById, dayLocations, onSelectDay }) {
  return (
    <div className="space-y-3">
      {dayList.map(function (date, index) {
        const items = itineraryItems
          .filter(function (i) { return i.date === date; })
          .slice()
          .sort(function (a, b) { return a.order - b.order; });
        const loc = (dayLocations && dayLocations[date]) || {};

        return (
          <div key={date} className="bg-white rounded-xl border border-amber-100 p-3">
            <button
              type="button"
              onClick={function () { onSelectDay(date); }}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-bold text-slate-800 flex items-center">
                Day {index + 1} · {date.slice(5)}
                <DayTabWeather tripId={tripId} date={date} lat={loc.lat} lng={loc.lng} />
              </span>
              <span className="text-xs text-brand-600">
                {items.length > 0 ? items.length + " 個行程 ›" : "還沒排 ›"}
              </span>
            </button>

            {items.length === 0 ? (
              <p className="text-sm text-slate-400 mt-2">這天還沒有安排行程</p>
            ) : (
              <div className="mt-2 divide-y divide-amber-50">
                {items.map(function (item) {
                  const w = wishlistById[item.wishlistItemId];
                  if (!w) return null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={function () { onSelectDay(date); }}
                      className="w-full flex items-center gap-2 py-1.5 text-left"
                    >
                      <span className="shrink-0 w-11 text-xs font-medium text-brand-700">{item.arrivalTime || "--:--"}</span>
                      <span className="min-w-0 flex-1 text-sm text-slate-700 truncate">{w.name}</span>
                      <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {CATEGORY_LABELS[w.category] || w.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
