// 顯示（並可新增）某個地點連結到的購物清單項目，讓願望清單/行程卡片跟購物清單頁面天生同步。
// 也會混入「只有我看得到」的私人項目（只有自己瀏覽器看得到，其他成員不會看到這些）。
// 用小卡片橫向排列，點圖可以放大看，多張的話能左右切換。
function LinkedShoppingMiniList({ tripId, wishlistItemId, nickname }) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const { data: sharedItems } = useCollection(
    "trips/" + tripId + "/shoppingItems",
    function (ref) { return ref.where("linkedWishlistItemId", "==", wishlistItemId); }
  );
  const privateItems = usePrivateShoppingItems(tripId).filter(function (i) {
    return !i.deletedAt && i.linkedWishlistItemId === wishlistItemId;
  });

  const items = sharedItems
    .filter(function (i) { return !i.deletedAt && isSharedItemVisible(i, nickname); })
    .map(function (i) { return Object.assign({ isPrivate: false }, i); })
    .concat(privateItems.map(function (i) { return Object.assign({ isPrivate: true }, i); }))
    .sort(function (a, b) { return toMillis(a.createdAt) - toMillis(b.createdAt); });

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      {lightboxIndex != null && (
        <ImageLightbox items={items} startIndex={lightboxIndex} onClose={function () { setLightboxIndex(null); }} />
      )}

      {items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-2 pb-1">
          {items.map(function (item, index) {
            return (
              <ShoppingItemCard
                key={(item.isPrivate ? "p-" : "s-") + item.id}
                tripId={tripId}
                item={item}
                nickname={nickname}
                compact={true}
                onImageClick={function () { setLightboxIndex(index); }}
              />
            );
          })}
        </div>
      )}

      {!showAdd ? (
        <button className="text-xs text-brand-600 hover:underline flex items-center gap-1" onClick={function () { setShowAdd(true); }}>
          <BagIcon className="w-3.5 h-3.5" /> ＋ 附加購物截圖
        </button>
      ) : (
        <div className="mt-1">
          <AddShoppingItemForm
            tripId={tripId}
            nickname={nickname}
            linkedWishlistItemId={wishlistItemId}
            onDone={function () { setShowAdd(false); }}
          />
          <button className="text-xs text-slate-400 hover:underline mt-1" onClick={function () { setShowAdd(false); }}>
            取消
          </button>
        </div>
      )}
    </div>
  );
}
