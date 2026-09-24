function ItineraryItemCard({ tripId, item, wishlistItem, isFirst, isLast, onMoveUp, onMoveDown, nickname }) {
  async function updateField(fields) {
    await db.doc("trips/" + tripId + "/itineraryItems/" + item.id).update(fields);
  }

  function handleRemove() {
    db.doc("trips/" + tripId + "/itineraryItems/" + item.id).update({ deletedAt: firebase.firestore.Timestamp.now() });
    showUndoToast("已從行程移除「" + (wishlistItem ? wishlistItem.name : "此項目") + "」", function () {
      db.doc("trips/" + tripId + "/itineraryItems/" + item.id).update({ deletedAt: null });
    });
  }

  function handleDurationChange(e) {
    const minutes = parseInt(e.target.value, 10);
    updateField({ durationMinutes: isNaN(minutes) ? 0 : minutes });
  }

  const [arrivalDraft, setArrivalDraft] = React.useState(item.arrivalTime || "09:00");
  React.useEffect(function () {
    setArrivalDraft(item.arrivalTime || "09:00");
  }, [item.arrivalTime]);

  function commitArrivalDraft() {
    if (arrivalDraft !== item.arrivalTime) {
      updateField({ arrivalTime: arrivalDraft });
    }
  }

  if (!wishlistItem) {
    return null;
  }

  const navLink = buildNavigationLink(wishlistItem);

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800">{wishlistItem.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
              {CATEGORY_LABELS[wishlistItem.category] || wishlistItem.category}
            </span>
          </div>
          {wishlistItem.address && <p className="text-sm text-slate-500 mt-0.5">{wishlistItem.address}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-25 text-sm px-1"
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-25 text-sm px-1"
            >
              ▼
            </button>
          </div>
          <button onClick={handleRemove} className="text-xs text-red-500 hover:underline">
            移除
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
        <span className="text-slate-500">
          抵達
          {isFirst ? (
            <input
              type="time"
              className="w-24 mx-1.5 rounded-lg border border-amber-100 px-2 py-1 text-sm"
              value={arrivalDraft}
              onChange={function (e) { setArrivalDraft(e.target.value); }}
              onBlur={commitArrivalDraft}
            />
          ) : (
            <span className="font-medium text-slate-700 ml-1.5">{item.arrivalTime || "--:--"}</span>
          )}
        </span>
        <span className="text-slate-500">
          停留
          <input
            type="number"
            min="0"
            step="15"
            className="w-16 mx-1.5 rounded-lg border border-amber-100 px-2 py-1 text-sm"
            value={item.durationMinutes}
            onChange={handleDurationChange}
          />
          分鐘
        </span>
        <span className="text-slate-500">
          離開 <span className="font-medium text-slate-700">{item.departureTime || "--:--"}</span>
        </span>
        <a
          href={navLink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-brand-600 hover:underline text-sm font-medium"
        >
          <CompassIcon className="w-4 h-4" /> 導航
        </a>
      </div>

      <LinkedShoppingMiniList tripId={tripId} wishlistItemId={wishlistItem.id} nickname={nickname} />
    </div>
  );
}
