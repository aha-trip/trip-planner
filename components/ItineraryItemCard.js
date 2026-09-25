// 精簡行程卡片：平常一列（時間＋名稱＋類別），點開才顯示細節與操作
function ItineraryItemCard({ tripId, item, wishlistItem, isFirst, isLast, onMoveUp, onMoveDown, nickname, expanded, onToggle, dayList, allWishlist, scheduledDatesByItem, destination }) {
  const [editing, setEditing] = React.useState(false);
  const [panel, setPanel] = React.useState(null); // "otherDay" | "nearby" | null
  const otherDays = (dayList || []).filter(function (d) { return d !== item.date; });
  const [otherDay, setOtherDay] = React.useState(otherDays[0] || "");
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [arrivalDraft, setArrivalDraft] = React.useState(item.arrivalTime || "09:00");

  React.useEffect(function () {
    setArrivalDraft(item.arrivalTime || "09:00");
  }, [item.arrivalTime]);

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

  function commitArrivalDraft() {
    if (arrivalDraft !== item.arrivalTime) updateField({ arrivalTime: arrivalDraft });
  }

  async function handleAddOtherDay() {
    const d = otherDay || otherDays[0];
    if (!d) return;
    await addWishlistItemToDay(tripId, wishlistItem.id, d);
    setPanel(null);
  }

  async function handleMoveToDay() {
    const d = otherDay || otherDays[0];
    if (!d) return;
    await updateField({ date: d, order: Date.now(), arrivalTime: null, departureTime: null, travelTimeMinutes: null, travelTimeSource: "auto" });
    showUndoToast("已搬到 " + d, function () {
      updateField({ date: item.date, order: item.order, arrivalTime: item.arrivalTime || null, departureTime: item.departureTime || null, travelTimeMinutes: item.travelTimeMinutes == null ? null : item.travelTimeMinutes, travelTimeSource: item.travelTimeSource || "auto" });
    });
  }

  if (!wishlistItem) return null;

  const actionClass = function (active) {
    return (
      "min-h-[40px] px-3 rounded-lg text-sm border transition " +
      (active ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-amber-200 text-slate-700 active:bg-amber-50")
    );
  };

  return (
    <div className="bg-white rounded-xl border border-amber-100">
      <button type="button" onClick={onToggle} className="w-full text-left px-3 py-2.5 flex items-center gap-2" aria-expanded={expanded}>
        <span className="shrink-0 w-12 text-center leading-tight">
          <span className="block text-sm font-semibold text-brand-700">{item.arrivalTime || "--:--"}</span>
          <span className="block text-[10px] text-slate-400">{item.durationMinutes || 0} 分</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={"block font-semibold text-slate-800 " + (expanded ? "break-words" : "truncate")}>{wishlistItem.name}</span>
          {wishlistItem.address && (
            <span className={"block text-xs text-slate-500 " + (expanded ? "break-words" : "truncate")}>{wishlistItem.address}</span>
          )}
        </span>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
          {CATEGORY_LABELS[wishlistItem.category] || wishlistItem.category}
        </span>
        <span className="shrink-0 text-slate-400 text-sm">{expanded ? "▴" : "▾"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-amber-50">
          {wishlistItem.notes && (
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-line break-words"><LinkifiedText text={wishlistItem.notes} /></p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm">
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
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {otherDays.length > 0 && (
              <button onClick={function () { setPanel(panel === "otherDay" ? null : "otherDay"); }} className={actionClass(panel === "otherDay")}>
                搬／加到其他天
              </button>
            )}
            {allWishlist && (
              <button onClick={function () { setPanel(panel === "nearby" ? null : "nearby"); }} className={actionClass(panel === "nearby")}>
                附近
              </button>
            )}
            <button onClick={function () { setEditing(true); }} className={actionClass(false) + " inline-flex items-center gap-1"}>
              <PencilIcon className="w-4 h-4" /> 編輯
            </button>
            <a
              href={buildNavigationLink(wishlistItem)}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClass(false) + " inline-flex items-center gap-1 text-brand-700"}
            >
              <CompassIcon className="w-4 h-4" /> 導航
            </a>
            <button onClick={onMoveUp} disabled={isFirst} className={actionClass(false) + " disabled:opacity-30"} aria-label="上移">▲</button>
            <button onClick={onMoveDown} disabled={isLast} className={actionClass(false) + " disabled:opacity-30"} aria-label="下移">▼</button>
          </div>

          {panel === "otherDay" && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <select
                className="text-sm rounded-lg border border-amber-200 px-2 py-2.5"
                value={otherDay || otherDays[0]}
                onChange={function (e) { setOtherDay(e.target.value); }}
              >
                {otherDays.map(function (d) { return <option key={d} value={d}>{d}</option>; })}
              </select>
              <button onClick={handleMoveToDay} className="min-h-[40px] text-sm rounded-lg bg-brand-600 text-white px-3">搬到這天</button>
              <button onClick={handleAddOtherDay} className="min-h-[40px] text-sm rounded-lg border border-brand-600 text-brand-700 px-3">也加一份到這天</button>
            </div>
          )}

          {panel === "nearby" && allWishlist && (
            <NearbyPanel
              tripId={tripId}
              item={wishlistItem}
              allItems={allWishlist}
              scheduledDatesByItem={scheduledDatesByItem || {}}
              dayList={dayList || []}
              destination={destination}
            />
          )}

          <div className="mt-3">
            <LinkedShoppingMiniList tripId={tripId} wishlistItemId={wishlistItem.id} nickname={nickname} />
          </div>

          <div className="mt-2 text-right">
            {confirmRemove ? (
              <span className="text-sm">
                確定移除？
                <button onClick={handleRemove} className="min-h-[36px] px-3 text-red-600 font-medium">移除</button>
                <button onClick={function () { setConfirmRemove(false); }} className="min-h-[36px] px-2 text-slate-400">取消</button>
              </span>
            ) : (
              <button onClick={function () { setConfirmRemove(true); }} className="min-h-[36px] px-2 text-xs text-red-500">
                從行程移除
              </button>
            )}
          </div>
        </div>
      )}

      {editing && <WishlistEditor tripId={tripId} item={wishlistItem} onClose={function () { setEditing(false); }} />}
    </div>
  );
}
