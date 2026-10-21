// V1~V5：票券保管箱。機票/住宿/門票/交通券/eSIM/入境資料/保險/其他，全部集中在這裡，
// 到了門口打開 App 就找得到，不用在相簿裡滑兩百張照片找 QR Code。
function VaultPage({ tripId, nickname }) {
  const auth = useAuth();
  const [showAdd, setShowAdd] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [usedCollapsed, setUsedCollapsed] = React.useState(true);
  const [quickViewItem, setQuickViewItem] = React.useState(null);
  const [lightboxIndex, setLightboxIndex] = React.useState(null);

  const { data: sharedItems, loading } = useCollection("trips/" + tripId + "/vaultItems");
  const privateItems = usePrivateVaultItems(tripId);
  const { data: wishlistItems } = useCollection("trips/" + tripId + "/wishlistItems", function (ref) { return ref.orderBy("createdAt"); });

  const [localLeftover, setLocalLeftover] = React.useState(function () { return readPrivateVaultItems(tripId); });
  const [migrating, setMigrating] = React.useState(false);
  const [migrateResult, setMigrateResult] = React.useState(null);
  React.useEffect(function () {
    function refresh() { setLocalLeftover(readPrivateVaultItems(tripId)); }
    refresh();
    privateVaultListeners.push(refresh);
    return function () {
      const idx = privateVaultListeners.indexOf(refresh);
      if (idx >= 0) privateVaultListeners.splice(idx, 1);
    };
  }, [tripId]);

  async function handleMigrate() {
    setMigrating(true);
    const result = await migratePrivateVaultToCloud(tripId);
    setMigrateResult(result);
    setMigrating(false);
  }

  const allItems = sharedItems
    .filter(function (i) { return !i.deletedAt && isSharedItemVisible(i, nickname); })
    .map(function (i) { return Object.assign({ isPrivate: false }, i); })
    .concat(privateItems.map(function (i) { return Object.assign({ isPrivate: true }, i); }));

  const filtered = categoryFilter === "all" ? allItems : allItems.filter(function (i) { return i.category === categoryFilter; });

  const active = filtered.filter(function (i) { return !i.usedAt; })
    .sort(function (a, b) {
      if (a.startsAt && b.startsAt) return a.startsAt < b.startsAt ? -1 : 1;
      if (a.startsAt) return -1;
      if (b.startsAt) return 1;
      return toMillis(b.createdAt) - toMillis(a.createdAt);
    });
  const used = filtered.filter(function (i) { return i.usedAt; })
    .sort(function (a, b) { return b.usedAt - a.usedAt; });

  const imagesForLightbox = active.filter(function (i) { return i.imageUrl; });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
        🎫 保管箱
      </h2>

      {auth.isGoogle && localLeftover.length > 0 && (
        <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-sm text-sky-800 flex items-center justify-between gap-2 flex-wrap">
          <span>這台裝置上有 {localLeftover.length} 筆「只有我」的憑證是登入前新增的，還沒同步到你的帳號</span>
          <button onClick={handleMigrate} disabled={migrating} className="shrink-0 min-h-[36px] px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50">
            {migrating ? "同步中..." : "同步到帳號"}
          </button>
        </div>
      )}
      {migrateResult && (
        <p className="text-xs text-slate-500">已同步 {migrateResult.moved} 筆{migrateResult.failed > 0 ? "，" + migrateResult.failed + " 筆失敗" : ""}。</p>
      )}

      {!showAdd ? (
        <button onClick={function () { setShowAdd(true); }} className="w-full min-h-[44px] rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">
          ＋ 新增憑證
        </button>
      ) : (
        <AddVaultItemForm
          tripId={tripId}
          nickname={nickname}
          wishlistItems={wishlistItems}
          onCancel={function () { setShowAdd(false); }}
          onDone={function () { setShowAdd(false); }}
        />
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={function () { setCategoryFilter("all"); }}
          className={"px-2.5 py-1 rounded-full text-xs font-medium border " + (categoryFilter === "all" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600")}
        >
          全部
        </button>
        {VAULT_CATEGORIES.map(function (c) {
          return (
            <button
              key={c.key}
              onClick={function () { setCategoryFilter(c.key); }}
              className={"px-2.5 py-1 rounded-full text-xs font-medium border " + (categoryFilter === c.key ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600")}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-slate-400 text-sm">載入中...</p>}
      {!loading && filtered.length === 0 && <p className="text-slate-400 text-sm">還沒有任何憑證，上面新增第一筆吧！</p>}

      <div className="space-y-2">
        {active.map(function (item, idx) {
          return (
            <VaultItemCard
              key={(item.isPrivate ? "p-" : "s-") + item.id}
              tripId={tripId}
              item={item}
              wishlistItems={wishlistItems}
              onImageClick={function () { setLightboxIndex(imagesForLightbox.indexOf(item)); }}
              onQuickView={function () { setQuickViewItem(item); }}
            />
          );
        })}
      </div>

      {used.length > 0 && (
        <div>
          <button onClick={function () { setUsedCollapsed(!usedCollapsed); }} className="w-full flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
            <span>✅ 已使用（{used.length}）</span>
            <span className="text-xs text-slate-400">{usedCollapsed ? "展開" : "收合"}</span>
          </button>
          {!usedCollapsed && (
            <div className="space-y-2">
              {used.map(function (item) {
                return <VaultItemCard key={(item.isPrivate ? "p-" : "s-") + item.id} tripId={tripId} item={item} wishlistItems={wishlistItems} />;
              })}
            </div>
          )}
        </div>
      )}

      {quickViewItem && <VaultQuickView item={quickViewItem} onClose={function () { setQuickViewItem(null); }} />}
      {lightboxIndex != null && (
        <ImageLightbox items={imagesForLightbox} startIndex={lightboxIndex} onClose={function () { setLightboxIndex(null); }} />
      )}
    </div>
  );
}
