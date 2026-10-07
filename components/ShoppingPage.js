function ShoppingPage({ tripId, nickname }) {
  const auth = useAuth();
  const [lightboxIndex, setLightboxIndex] = React.useState(null);
  const { data: sharedItems, loading } = useCollection("trips/" + tripId + "/shoppingItems");
  const privateItems = usePrivateShoppingItems(tripId);
  const { data: wishlistItems } = useCollection(
    "trips/" + tripId + "/wishlistItems",
    function (ref) { return ref.orderBy("createdAt"); }
  );

  // 用 Google 登入後，看看這台裝置上還有沒有「登入前」留下的私人截圖，讓使用者一鍵搬到帳號上
  const [localLeftover, setLocalLeftover] = React.useState(function () { return readPrivateShoppingItems(tripId); });
  const [migrating, setMigrating] = React.useState(false);
  const [migrateResult, setMigrateResult] = React.useState(null);
  React.useEffect(function () {
    function refresh() { setLocalLeftover(readPrivateShoppingItems(tripId)); }
    refresh();
    privateShoppingListeners.push(refresh);
    return function () {
      const idx = privateShoppingListeners.indexOf(refresh);
      if (idx >= 0) privateShoppingListeners.splice(idx, 1);
    };
  }, [tripId]);

  async function handleMigrate() {
    setMigrating(true);
    const result = await migratePrivateShoppingToCloud(tripId);
    setMigrateResult(result);
    setMigrating(false);
  }

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
      {auth.isGoogle && localLeftover.length > 0 && (
        <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-sm text-sky-800 flex items-center justify-between gap-2 flex-wrap">
          <span>這台裝置上有 {localLeftover.length} 張「只有我」的截圖是登入前新增的，還沒同步到你的帳號，別的裝置看不到</span>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="shrink-0 min-h-[36px] px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
          >
            {migrating ? "同步中..." : "同步到帳號"}
          </button>
        </div>
      )}
      {migrateResult && (
        <p className="text-xs text-slate-500">
          已同步 {migrateResult.moved} 張{migrateResult.failed > 0 ? "，" + migrateResult.failed + " 張失敗（圖片可能已損毀）" : ""}。
        </p>
      )}
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
                nickname={nickname}
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
          className="fixed bottom-24 sm:bottom-6 right-6 z-20 w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center text-2xl leading-none"
          aria-label="回到上面新增購物項目"
          title="回到上面新增購物項目"
        >
          ＋
        </button>
      )}
    </div>
  );
}
