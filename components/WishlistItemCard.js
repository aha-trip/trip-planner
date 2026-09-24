function WishlistItemCard({ tripId, item, isScheduled, scheduledDates, dayList, nickname }) {
  const [selectedDay, setSelectedDay] = React.useState(dayList[0] || "");
  const [customDate, setCustomDate] = React.useState("");
  const [showAddAnotherDay, setShowAddAnotherDay] = React.useState(false);

  function handleDelete() {
    db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update({ deletedAt: firebase.firestore.Timestamp.now() });
    showUndoToast("已刪除「" + item.name + "」", function () {
      db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update({ deletedAt: null });
    });
  }

  async function handleAddToItinerary() {
    const date = dayList.length > 0 ? selectedDay : customDate;
    if (!date) return;
    await db.collection("trips/" + tripId + "/itineraryItems").add({
      wishlistItemId: item.id,
      date: date,
      order: Date.now(),
      transportMode: "walk",
      durationMinutes: 60,
      travelTimeMinutes: null,
      travelDistanceMeters: null,
      travelTimeSource: "auto",
      arrivalTime: null,
      departureTime: null,
      notes: "",
      createdAt: firebase.firestore.Timestamp.now(),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800">{item.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
              {CATEGORY_LABELS[item.category] || item.category}
            </span>
            {isScheduled && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                已排程：{scheduledDates.map(function (d) { return d.slice(5); }).join("、")}
              </span>
            )}
          </div>
          {item.address && <p className="text-sm text-slate-500 mt-0.5">{item.address}</p>}
          {item.notes && <p className="text-sm text-slate-600 mt-1">{item.notes}</p>}
          <p className="text-xs text-slate-400 mt-1">by {item.addedBy}</p>
        </div>
        <button onClick={handleDelete} className="min-h-[40px] px-2 -mr-2 text-xs text-red-500 shrink-0">
          刪除
        </button>
      </div>

      {(!isScheduled || showAddAnotherDay) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {dayList.length > 0 ? (
            <select
              className="text-sm rounded-lg border border-amber-200 px-2 py-2.5"
              value={selectedDay}
              onChange={function (e) { setSelectedDay(e.target.value); }}
            >
              {dayList.map(function (d) {
                return <option key={d} value={d}>{d}</option>;
              })}
            </select>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              選日期：
              <input
                type="date"
                className="text-sm rounded-lg border border-amber-200 px-2 py-2.5"
                value={customDate}
                onChange={function (e) { setCustomDate(e.target.value); }}
              />
            </span>
          )}
          <button
            onClick={handleAddToItinerary}
            className="text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 transition"
          >
            ＋ 加入行程
          </button>
        </div>
      )}
      {isScheduled && !showAddAnotherDay && (
        <button
          onClick={function () { setShowAddAnotherDay(true); }}
          className="mt-3 text-sm rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-2.5 transition"
        >
          ＋ 也想排進其他天
        </button>
      )}

      <LinkedShoppingMiniList tripId={tripId} wishlistItemId={item.id} nickname={nickname} />
    </div>
  );
}
