function ItineraryPage({ tripId, trip, nickname }) {
  const { data: rawItineraryItems, loading } = useCollection("trips/" + tripId + "/itineraryItems");
  const { data: rawWishlistItems } = useCollection("trips/" + tripId + "/wishlistItems");

  const itineraryItems = rawItineraryItems.filter(function (i) { return !i.deletedAt; });

  const wishlistById = {};
  rawWishlistItems
    .filter(function (w) { return !w.deletedAt; })
    .forEach(function (w) { wishlistById[w.id] = w; });

  const dayList = getTripDayList(trip, itineraryItems);
  const allWishlist = rawWishlistItems.filter(function (w) { return !w.deletedAt; });
  const scheduledDatesByItem = {};
  itineraryItems.forEach(function (i) {
    if (!scheduledDatesByItem[i.wishlistItemId]) scheduledDatesByItem[i.wishlistItemId] = [];
    scheduledDatesByItem[i.wishlistItemId].push(i.date);
  });
  Object.keys(scheduledDatesByItem).forEach(function (id) { scheduledDatesByItem[id].sort(); });

  const dayLocations = {};
  dayList.forEach(function (date) {
    dayLocations[date] = getFirstLocationForDay(date, itineraryItems, wishlistById);
  });

  const [activeDate, setActiveDate] = React.useState(null);

  React.useEffect(function () {
    if (!activeDate && dayList.length > 0) {
      setActiveDate(dayList[0]);
    }
  }, [dayList.join(","), activeDate]);

  if (loading) {
    return <p className="text-slate-400 text-sm">載入中...</p>;
  }

  if (dayList.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        還沒有安排任何一天的行程，先到「願望清單」把想去的地方加入某一天吧！
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href={"#/trip/" + tripId + "/print"}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          <ReceiptIcon className="w-3.5 h-3.5" /> 列印／離線總覽
        </a>
      </div>
      <DayTabs
        tripId={tripId}
        dayList={dayList}
        activeDate={activeDate || dayList[0]}
        onSelect={setActiveDate}
        dayLocations={dayLocations}
      />
      <DayColumn
        tripId={tripId}
        date={activeDate || dayList[0]}
        itineraryItems={itineraryItems}
        wishlistById={wishlistById}
        trip={trip}
        nickname={nickname}
        dayList={dayList}
        allWishlist={allWishlist}
        scheduledDatesByItem={scheduledDatesByItem}
      />
    </div>
  );
}
