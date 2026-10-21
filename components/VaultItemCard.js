function VaultItemCard({ tripId, item, wishlistItems, onImageClick, onQuickView }) {
  const [copied, setCopied] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const linkedWishlist = (wishlistItems || []).find(function (w) { return w.id === item.linkedWishlistItemId; });

  // V8「使用前提醒」：重用 R4 已經做好的行事曆機制，不用另外裝原生推播外掛。
  // datetime-local 輸入框沒有時區資訊，當成「填寫當下這支裝置的時區」來算，
  // 對大多數人在旅途中填資料的情境是合理的假設。
  const calendarTask = item.startsAt ? (function () {
    const parts = item.startsAt.split("T");
    return {
      id: item.id,
      title: item.title,
      deadlineAt: parts[0],
      openTime: parts[1] || "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: item.confirmationCode ? "預約編號：" + item.confirmationCode : item.notes,
    };
  })() : null;

  function toggleUsed(e) {
    e.stopPropagation();
    const patch = { usedAt: item.usedAt ? null : Date.now() };
    if (item.isPrivate) updatePrivateVaultItem(tripId, item.id, patch);
    else db.doc("trips/" + tripId + "/vaultItems/" + item.id).update(patch);
  }

  function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("刪除「" + item.title + "」？")) return;
    if (item.isPrivate) removePrivateVaultItem(tripId, item.id);
    else db.doc("trips/" + tripId + "/vaultItems/" + item.id).delete();
  }

  function handleCopyCode(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(item.confirmationCode).then(function () {
      setCopied(true);
      setTimeout(function () { setCopied(false); }, 1500);
    }).catch(function () {
      window.prompt("複製預約編號：", item.confirmationCode);
    });
  }

  const dateLabel = item.startsAt
    ? new Date(item.startsAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;
  const CategoryIcon = vaultCategoryIconComponent(item.category);

  return (
    <div className={"bg-white rounded-xl border p-3 flex gap-3 " + (item.usedAt ? "border-slate-100 opacity-60" : "border-amber-100")}>
      {item.imageUrl ? (
        <img
          src={cloudinaryThumbUrl(item.imageUrl, 160)}
          alt={item.title}
          onClick={function () { if (onImageClick) onImageClick(); }}
          className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-zoom-in"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
          <CategoryIcon className="w-6 h-6 text-brand-600" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className={"text-sm font-medium text-slate-800 truncate flex items-center gap-1.5 " + (item.usedAt ? "line-through" : "")}>
          <CategoryIcon className="w-3.5 h-3.5 text-brand-600 shrink-0" /> {item.title}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {dateLabel || vaultCategoryLabel(item.category)}
          {linkedWishlist && " ・ " + linkedWishlist.name}
        </p>
        {item.confirmationCode && (
          <button onClick={handleCopyCode} className="text-xs text-brand-600 mt-1 inline-flex items-center gap-1">
            <LinkIcon className="w-3 h-3" /> {copied ? "已複製！" : "編號：" + item.confirmationCode}
          </button>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {item.imageUrl && onQuickView && (
            <button onClick={function (e) { e.stopPropagation(); onQuickView(); }} className="text-xs text-brand-600 font-medium">出示</button>
          )}
          {calendarTask && (
            <button onClick={function (e) { e.stopPropagation(); setCalendarOpen(!calendarOpen); }} className="text-xs text-brand-600 inline-flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> 提醒
            </button>
          )}
          <button onClick={toggleUsed} className="text-xs text-slate-500">{item.usedAt ? "標記未使用" : "標記已使用"}</button>
          <button onClick={handleDelete} className="text-xs text-red-500">刪除</button>
        </div>
        {calendarOpen && calendarTask && (
          <div className="flex flex-wrap gap-2 mt-1.5" onClick={function (e) { e.stopPropagation(); }}>
            <a href={buildGoogleCalendarUrl(calendarTask)} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 underline">加到 Google 日曆</a>
            <button onClick={function () { downloadIcsFile(item.title, [calendarTask]); }} className="text-xs text-brand-700 underline">下載 .ics</button>
          </div>
        )}
      </div>
    </div>
  );
}
