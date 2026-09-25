// 精簡卡片：平常只顯示一列（類別＋名稱＋地址），點開才看到備註與操作列；各功能面板按需展開
function WishlistItemCard({ tripId, item, isScheduled, scheduledDates, dayList, nickname, allItems, scheduledDatesByItem, destination, expanded, onToggle }) {
  const [panel, setPanel] = React.useState(null); // "schedule" | "nearby" | "shopping" | null
  const [selectedDay, setSelectedDay] = React.useState(dayList[0] || "");
  const [customDate, setCustomDate] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function togglePanel(name) {
    setPanel(panel === name ? null : name);
  }

  function handleDelete() {
    db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update({ deletedAt: firebase.firestore.Timestamp.now() });
    showUndoToast("已刪除「" + item.name + "」", function () {
      db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update({ deletedAt: null });
    });
  }

  async function handleAddToItinerary() {
    const date = dayList.length > 0 ? selectedDay : customDate;
    if (!date) return;
    await addWishlistItemToDay(tripId, item.id, date);
    setPanel(null);
  }

  const actionClass = function (active) {
    return (
      "min-h-[40px] px-3 rounded-lg text-sm border transition " +
      (active ? "bg-brand-600 border-brand-600 text-white" : "bg-white border-amber-200 text-slate-700 active:bg-amber-50")
    );
  };

  return (
    <div className="bg-white rounded-xl border border-amber-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 flex items-center gap-2"
        aria-expanded={expanded}
      >
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
          {CATEGORY_LABELS[item.category] || item.category}
        </span>
        <span className="min-w-0 flex-1">
          <span className={"block font-semibold text-slate-800 " + (expanded ? "break-words" : "truncate")}>{item.name}</span>
          {item.address && (
            <span className={"block text-xs text-slate-500 " + (expanded ? "break-words" : "truncate")}>{item.address}</span>
          )}
        </span>
        {isScheduled && (
          <span className="shrink-0 text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            ✓ {scheduledDates.length > 1 ? scheduledDates.length + "天" : scheduledDates[0].slice(5)}
          </span>
        )}
        <span className="shrink-0 text-slate-400 text-sm">{expanded ? "▴" : "▾"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-amber-50">
          {isScheduled && (
            <p className="text-xs text-emerald-700 mt-2">已排程：{scheduledDates.map(function (d) { return d.slice(5); }).join("、")}</p>
          )}
          {item.notes && (
            <p className="text-sm text-slate-600 mt-2 whitespace-pre-line break-words">
              <LinkifiedText text={item.notes} />
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">by {item.addedBy}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={function () { togglePanel("schedule"); }} className={actionClass(panel === "schedule")}>
              {isScheduled ? "＋ 其他天" : "＋ 排進行程"}
            </button>
            {allItems && (
              <button onClick={function () { togglePanel("nearby"); }} className={actionClass(panel === "nearby")}>
                附近
              </button>
            )}
            <button onClick={function () { setEditing(true); }} className={actionClass(false) + " inline-flex items-center gap-1"}>
              <PencilIcon className="w-4 h-4" /> 編輯
            </button>
            <a
              href={buildPlaceLink(item)}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClass(false) + " inline-flex items-center gap-1"}
            >
              <PinIcon className="w-4 h-4" /> 地圖
            </a>
          </div>

          {panel === "schedule" && (
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
                <input
                  type="date"
                  className="text-sm rounded-lg border border-amber-200 px-2 py-2.5"
                  value={customDate}
                  onChange={function (e) { setCustomDate(e.target.value); }}
                />
              )}
              <button
                onClick={handleAddToItinerary}
                className="min-h-[40px] text-sm rounded-lg bg-brand-600 text-white px-4"
              >
                加入
              </button>
            </div>
          )}

          {panel === "nearby" && allItems && (
            <NearbyPanel
              tripId={tripId}
              item={item}
              allItems={allItems}
              scheduledDatesByItem={scheduledDatesByItem || {}}
              dayList={dayList}
              destination={destination}
            />
          )}

          <div className="mt-3">
            <LinkedShoppingMiniList tripId={tripId} wishlistItemId={item.id} nickname={nickname} />
          </div>

          <div className="mt-3 text-right">
            {confirmDelete ? (
              <span className="text-sm">
                確定刪除？
                <button onClick={handleDelete} className="min-h-[36px] px-3 text-red-600 font-medium">刪除</button>
                <button onClick={function () { setConfirmDelete(false); }} className="min-h-[36px] px-2 text-slate-400">取消</button>
              </span>
            ) : (
              <button onClick={function () { setConfirmDelete(true); }} className="min-h-[36px] px-2 text-xs text-red-500">
                刪除這個地點
              </button>
            )}
          </div>
        </div>
      )}

      {editing && <WishlistEditor tripId={tripId} item={item} onClose={function () { setEditing(false); }} />}
    </div>
  );
}
