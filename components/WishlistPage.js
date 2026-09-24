const WISHLIST_CATEGORY_FILTERS = ["all", "sight", "food", "activity", "shopping", "other"];

function WishlistPage({ tripId, trip, nickname }) {
  const { data: rawItems, loading } = useCollection(
    "trips/" + tripId + "/wishlistItems",
    function (ref) { return ref.orderBy("createdAt"); }
  );
  const { data: itineraryItems } = useCollection("trips/" + tripId + "/itineraryItems");
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const allItems = rawItems.filter(function (i) { return !i.deletedAt; });

  const scheduledDatesByItem = {};
  itineraryItems
    .filter(function (i) { return !i.deletedAt; })
    .forEach(function (i) {
      if (!scheduledDatesByItem[i.wishlistItemId]) scheduledDatesByItem[i.wishlistItemId] = [];
      scheduledDatesByItem[i.wishlistItemId].push(i.date);
    });
  Object.keys(scheduledDatesByItem).forEach(function (id) { scheduledDatesByItem[id].sort(); });
  const dayList = getTripDayList(trip, itineraryItems.filter(function (i) { return !i.deletedAt; }));

  const keyword = search.trim().toLowerCase();
  const items = allItems.filter(function (item) {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (!keyword) return true;
    const haystack = [item.name, item.address, item.notes].filter(Boolean).join(" ").toLowerCase();
    return haystack.indexOf(keyword) >= 0;
  });

  function scrollToAddForm() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6 relative">
      <div id="wishlist-add-form">
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <PinIcon className="w-5 h-5 text-brand-600" /> 新增想去的地方
        </h2>
        <AddWishlistItemForm tripId={tripId} nickname={nickname} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <HeartListIcon className="w-5 h-5 text-brand-600" /> 願望清單 ({items.length}
          {items.length !== allItems.length ? " / " + allItems.length : ""})
        </h2>

        {allItems.length > 0 && (
          <div className="space-y-2 mb-3">
            <input
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="搜尋名稱、地址、備註..."
              value={search}
              onChange={function (e) { setSearch(e.target.value); }}
            />
            <div className="flex flex-wrap gap-1.5">
              {WISHLIST_CATEGORY_FILTERS.map(function (c) {
                const label = c === "all" ? "全部" : CATEGORY_LABELS[c];
                return (
                  <button
                    key={c}
                    onClick={function () { setCategoryFilter(c); }}
                    className={
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition " +
                      (categoryFilter === c ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && <p className="text-slate-400 text-sm">載入中...</p>}
        {!loading && allItems.length === 0 && (
          <p className="text-slate-400 text-sm">還沒有任何項目，大家一起丟出想去的地方吧！</p>
        )}
        {!loading && allItems.length > 0 && items.length === 0 && (
          <p className="text-slate-400 text-sm">找不到符合的項目，換個關鍵字或類別試試。</p>
        )}
        <div className="space-y-3">
          {items.map(function (item) {
            return (
              <WishlistItemCard
                key={item.id}
                tripId={tripId}
                item={item}
                isScheduled={Boolean(scheduledDatesByItem[item.id])}
                scheduledDates={scheduledDatesByItem[item.id] || []}
                dayList={dayList}
                nickname={nickname}
              />
            );
          })}
        </div>
      </div>

      {allItems.length > 1 && (
        <button
          onClick={scrollToAddForm}
          className="fixed bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center text-2xl leading-none"
          aria-label="回到上面新增地點"
          title="回到上面新增地點"
        >
          ＋
        </button>
      )}
    </div>
  );
}
