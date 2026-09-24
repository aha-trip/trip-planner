function ShoppingPage({ tripId, nickname }) {
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const { data: sharedItems, loading } = useCollection("trips/" + tripId + "/shoppingItems");
  const privateItems = usePrivateShoppingItems(tripId);
  const { data: wishlistItems } = useCollection(
    "trips/" + tripId + "/wishlistItems",
    function (ref) { return ref.orderBy("createdAt"); }
  );

  const items = sharedItems
    .filter(function (i) { return !i.deletedAt && isSharedItemVisible(i, nickname); })
    .map(function (i) { return Object.assign({ isPrivate: false }, i); })
    .concat(
      privateItems
        .filter(function (i) { return !i.deletedAt; })
        .map(function (i) { return Object.assign({ isPrivate: true }, i); })
    )
    .sort(function (a, b) { return toMillis(b.createdAt) - toMillis(a.createdAt); });

  function scrollToAddForm() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <BagIcon className="w-5 h-5 text-brand-600" /> 新增購物項目
        </h2>
        <AddShoppingItemForm tripId={tripId} nickname={nickname} wishlistItems={wishlistItems} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
          <ReceiptIcon className="w-5 h-5 text-brand-600" /> 購物清單 ({items.length})
        </h2>
        {loading && <p className="text-slate-400 text-sm">載入中...</p>}
        {!loading && items.length === 0 && (
          <p className="text-slate-400 text-sm">還沒有任何購物截圖，上面新增第一筆吧！</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(function (item, index) {
            return (
              <ShoppingItemCard
                key={(item.isPrivate ? "p-" : "s-") + item.id}
                tripId={tripId}
                item={item}
                wishlistItems={wishlistItems}
                onImageClick={function () { setLightboxIndex(index); }}
              />
            );
          })}
        </div>
      </div>

      {lightboxIndex != null && (
        <ImageLightbox items={items} startIndex={lightboxIndex} onClose={function () { setLightboxIndex(null); }} />
      )}

      {items.length > 1 && (
        <button
          onClick={scrollToAddForm}
          className="fixed bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center text-2xl leading-none"
          aria-label="回到上面新增購物項目"
          title="回到上面新增購物項目"
        >
          ＋
        </button>
      )}
    </div>
  );
}
