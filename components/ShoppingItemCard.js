function ShoppingItemCard({ tripId, item, wishlistItems, compact, onImageClick }) {
  const [changingLink, setChangingLink] = React.useState(false);
  const [editingCaption, setEditingCaption] = React.useState(false);
  const [captionDraft, setCaptionDraft] = React.useState(item.caption || "");
  const isPrivate = Boolean(item.isPrivate);
  const isSpecificShare = !isPrivate && item.visibleTo && item.visibleTo.length > 0;

  const linkedWishlist = (wishlistItems || []).find(function (w) { return w.id === item.linkedWishlistItemId; });

  function handleDelete(e) {
    if (e) e.stopPropagation();
    if (isPrivate) {
      updatePrivateShoppingItem(tripId, item.id, { deletedAt: Date.now() });
      showUndoToast("已刪除「" + (item.caption || "購物截圖") + "」", function () {
        updatePrivateShoppingItem(tripId, item.id, { deletedAt: null });
      });
      return;
    }
    db.doc("trips/" + tripId + "/shoppingItems/" + item.id).update({ deletedAt: firebase.firestore.Timestamp.now() });
    showUndoToast("已刪除「" + (item.caption || "購物截圖") + "」", function () {
      db.doc("trips/" + tripId + "/shoppingItems/" + item.id).update({ deletedAt: null });
    });
  }

  async function handleChangeLink(e) {
    const value = e.target.value;
    if (isPrivate) {
      updatePrivateShoppingItem(tripId, item.id, { linkedWishlistItemId: value || null });
    } else {
      await db.doc("trips/" + tripId + "/shoppingItems/" + item.id).update({
        linkedWishlistItemId: value || null,
      });
    }
    setChangingLink(false);
  }

  async function handleSaveCaption() {
    setEditingCaption(false);
    if (captionDraft === (item.caption || "")) return;
    if (isPrivate) {
      updatePrivateShoppingItem(tripId, item.id, { caption: captionDraft.trim() });
    } else {
      await db.doc("trips/" + tripId + "/shoppingItems/" + item.id).update({ caption: captionDraft.trim() });
    }
  }

  const badge = isPrivate
    ? { Icon: LockIcon, text: "只有我看得到" }
    : isSpecificShare
    ? { Icon: PeopleIcon, text: "指定對象", title: "分享給：" + item.visibleTo.join("、") }
    : null;

  if (compact) {
    return (
      <div className="w-24 shrink-0">
        <div className="relative">
          <img
            src={item.imageUrl}
            alt={item.caption || "購物截圖"}
            onClick={onImageClick}
            className="w-24 h-24 object-cover rounded-lg cursor-zoom-in"
          />
          {badge && (
            <span
              className="absolute top-0.5 left-0.5 flex items-center gap-0.5 text-[9px] leading-none px-1 py-0.5 rounded-full bg-slate-900/70 text-white"
              title={badge.title}
            >
              <badge.Icon className="w-2.5 h-2.5" /> {badge.text}
            </span>
          )}
          <button
            onClick={handleDelete}
            className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-slate-900/60 text-white text-[10px] leading-none"
            aria-label="刪除"
          >
            ✕
          </button>
        </div>
        {item.caption && <p className="text-[11px] text-slate-500 truncate mt-1">{item.caption}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.caption || "購物截圖"}
          onClick={onImageClick}
          className="w-full h-40 object-cover cursor-zoom-in"
        />
        {badge && (
          <span
            className="absolute top-1 left-1 flex items-center gap-1 text-[10px] leading-none px-1.5 py-1 rounded-full bg-slate-900/70 text-white"
            title={badge.title}
          >
            <badge.Icon className="w-3 h-3" /> {badge.text}
          </span>
        )}
      </div>
      <div className="p-3">
        {!editingCaption ? (
          <p
            className="text-sm text-slate-700 truncate cursor-text hover:bg-amber-50 rounded px-1 -mx-1"
            onClick={function () { setCaptionDraft(item.caption || ""); setEditingCaption(true); }}
            title="點一下編輯備註"
          >
            {item.caption || <span className="text-slate-300">＋ 加備註</span>}
          </p>
        ) : (
          <input
            autoFocus
            className="w-full text-sm rounded border border-amber-200 px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={captionDraft}
            onChange={function (e) { setCaptionDraft(e.target.value); }}
            onBlur={handleSaveCaption}
            onKeyDown={function (e) { if (e.key === "Enter") e.target.blur(); }}
          />
        )}
        <p className="text-xs text-slate-400 mt-0.5">by {item.addedBy}</p>

        <div className="mt-2">
          {!changingLink ? (
            <button
              className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1"
              onClick={function () { setChangingLink(true); }}
            >
              {linkedWishlist ? (<><PinIcon className="w-3 h-3" /> {linkedWishlist.name}</>) : "＋ 連結地點"}
            </button>
          ) : (
            <select
              autoFocus
              className="text-xs rounded border border-amber-200 px-2 py-1"
              defaultValue={item.linkedWishlistItemId || ""}
              onChange={handleChangeLink}
              onBlur={function () { setChangingLink(false); }}
            >
              <option value="">不連結地點</option>
              {(wishlistItems || []).map(function (w) {
                return <option key={w.id} value={w.id}>{w.name}</option>;
              })}
            </select>
          )}
        </div>

        <button onClick={handleDelete} className="text-xs text-red-500 hover:underline mt-2">
          刪除
        </button>
      </div>
    </div>
  );
}
