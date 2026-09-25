function ShoppingItemCard({ tripId, item, wishlistItems, compact, onImageClick, nickname }) {
  const [changingLink, setChangingLink] = React.useState(false);
  const [editingCaption, setEditingCaption] = React.useState(false);
  const [captionDraft, setCaptionDraft] = React.useState(item.caption || "");
  const [editingScope, setEditingScope] = React.useState(false);
  const isPrivate = Boolean(item.isPrivate);
  // 只有新增這筆的人（或私人項目的主人）可以改分享範圍
  const canEditScope = isPrivate || (Boolean(nickname) && item.addedBy === nickname);

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

  async function handleChangeLink(value) {
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

  const scope = scopeOfItem(item);
  const scopeInfo = {
    everyone: { Icon: GlobeIcon, text: "所有人", title: "所有人都看得到" },
    specific: { Icon: PeopleIcon, text: "指定對象", title: "分享給：" + (item.visibleTo || []).join("、") },
    private: { Icon: LockIcon, text: "只有我", title: "只有我看得到" },
  }[scope];

  const scopeEditor = editingScope && (
    <ShareScopeEditor tripId={tripId} item={item} nickname={nickname} onClose={function () { setEditingScope(false); }} />
  );

  if (compact) {
    return (
      <div className="w-28 shrink-0">
        {scopeEditor}
        <div className="relative">
          <img
            src={item.imageUrl}
            alt={item.caption || "購物截圖"}
            onClick={onImageClick}
            className="w-28 h-28 object-cover rounded-lg cursor-zoom-in"
          />
          <button
            onClick={function (e) { e.stopPropagation(); if (canEditScope) setEditingScope(true); }}
            title={scopeInfo.title}
            className="absolute bottom-1 left-1 min-h-[28px] flex items-center gap-1 text-[11px] leading-none px-2 rounded-full bg-slate-900/70 text-white"
          >
            <scopeInfo.Icon className="w-3 h-3" /> {scopeInfo.text}
          </button>
          <button
            onClick={handleDelete}
            className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-slate-900/60 text-white text-xs leading-none"
            aria-label="刪除"
          >
            ✕
          </button>
        </div>
        {item.caption && <p className="text-xs text-slate-500 truncate mt-1">{item.caption}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
      {scopeEditor}
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.caption || "購物截圖"}
          onClick={onImageClick}
          className="w-full h-40 object-cover cursor-zoom-in"
        />
      </div>
      <div className="p-3">
        {!editingCaption ? (
          <p
            className="text-sm text-slate-700 truncate cursor-text hover:bg-amber-50 rounded px-1 -mx-1 min-h-[32px] flex items-center"
            onClick={function () { setCaptionDraft(item.caption || ""); setEditingCaption(true); }}
            title="點一下編輯備註"
          >
            {item.caption ? <LinkifiedText text={item.caption} /> : <span className="text-slate-300">＋ 加備註</span>}
          </p>
        ) : (
          <input
            autoFocus
            className="w-full text-base rounded border border-amber-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            value={captionDraft}
            onChange={function (e) { setCaptionDraft(e.target.value); }}
            onBlur={handleSaveCaption}
            onKeyDown={function (e) { if (e.key === "Enter") e.target.blur(); }}
          />
        )}
        <p className="text-xs text-slate-400 mt-0.5">by {item.addedBy}</p>

        <button
          onClick={function () { if (canEditScope) setEditingScope(true); }}
          title={scopeInfo.title}
          className={
            "mt-2 min-h-[36px] inline-flex items-center gap-1 text-xs rounded-full px-2.5 border " +
            (canEditScope ? "border-amber-200 text-slate-600 bg-white active:bg-amber-50" : "border-transparent text-slate-400 px-0")
          }
        >
          <scopeInfo.Icon className="w-3.5 h-3.5" /> {scopeInfo.text}{canEditScope ? " ›" : ""}
        </button>

        <div className="mt-1">
          <button
            className="min-h-[36px] text-xs text-brand-600 inline-flex items-center gap-1"
            onClick={function () { setChangingLink(true); }}
          >
            {linkedWishlist ? (<><PinIcon className="w-3 h-3" /> {linkedWishlist.name}</>) : "＋ 連結地點"}
          </button>
          {changingLink && (
            <WishlistPicker
              items={wishlistItems}
              value={item.linkedWishlistItemId || ""}
              onPick={handleChangeLink}
              onClose={function () { setChangingLink(false); }}
            />
          )}
        </div>

        <button onClick={handleDelete} className="min-h-[36px] text-xs text-red-500">
          刪除
        </button>
      </div>
    </div>
  );
}
