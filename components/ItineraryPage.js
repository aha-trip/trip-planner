function ItineraryPage({ tripId, trip, nickname }) {
  const { data: rawItineraryItems, loading } = useCollection("trips/" + tripId + "/itineraryItems");
  const { data: rawWishlistItems } = useCollection("trips/" + tripId + "/wishlistItems");
  const { data: members } = useCollection("trips/" + tripId + "/members");
  const memberNames = members.map(function (m) { return m.nickname; }).filter(Boolean);

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
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("day"); // "day" | "overview"

  function goToDay(date) {
    setActiveDate(date);
    setViewMode("day");
  }

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
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={function () { setViewMode("day"); }}
            className={
              "min-h-[36px] px-3 rounded-lg text-sm border " +
              (viewMode === "day" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")
            }
          >
            分天檢視
          </button>
          <button
            type="button"
            onClick={function () { setViewMode("overview"); }}
            className={
              "min-h-[36px] px-3 rounded-lg text-sm border " +
              (viewMode === "overview" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")
            }
          >
            整趟總覽
          </button>
        </div>
        <a
          href={"#/trip/" + tripId + "/print"}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          <ReceiptIcon className="w-3.5 h-3.5" /> 列印／離線總覽
        </a>
      </div>

      {viewMode === "overview" ? (
        <ItineraryOverview
          tripId={tripId}
          dayList={dayList}
          itineraryItems={itineraryItems}
          wishlistById={wishlistById}
          dayLocations={dayLocations}
          onSelectDay={goToDay}
        />
      ) : (
        <React.Fragment>
          <DayTabs
            tripId={tripId}
            dayList={dayList}
            activeDate={activeDate || dayList[0]}
            onSelect={setActiveDate}
            dayLocations={dayLocations}
          />
          <div>
            <button
              type="button"
              onClick={function () { setShowAddForm(!showAddForm); }}
              className="min-h-[40px] inline-flex items-center gap-1 text-sm text-brand-700"
            >
              <PinIcon className="w-4 h-4" /> {showAddForm ? "收起 ▴" : "＋ 新增地點到這天 ▾"}
            </button>
            {showAddForm && (
              <div className="mt-2">
                <AddWishlistItemForm
                  tripId={tripId}
                  nickname={nickname}
                  submitLabel={"加入並排進 " + (activeDate || dayList[0]).slice(5)}
                  onCreated={async function (id) {
                    await addWishlistItemToDay(tripId, id, activeDate || dayList[0]);
                    setShowAddForm(false);
                  }}
                />
              </div>
            )}
          </div>
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
            memberNames={memberNames}
          />
        </React.Fragment>
      )}
    </div>
  );
}
