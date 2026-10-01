// 行李清單：「共同」項目大家都看得到，但每個人各自打勾（提醒大家都要帶，例如護照）；
// 「個人」項目只存在自己瀏覽器的 localStorage，別人完全看不到（自己才需要的東西）。
function PackingItemName({ name, checked, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onSave(trimmed);
    else setDraft(name);
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="w-full text-sm rounded border border-amber-200 px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
        value={draft}
        onChange={function (e) { setDraft(e.target.value); }}
        onBlur={commit}
        onKeyDown={function (e) { if (e.key === "Enter") e.target.blur(); }}
      />
    );
  }

  return (
    <span
      onClick={function () { setDraft(name); setEditing(true); }}
      className={"text-sm cursor-text hover:bg-amber-50 rounded px-1 -mx-1 " + (checked ? "text-slate-400 line-through" : "text-slate-800")}
      title="點一下修改文字"
    >
      {name}
    </span>
  );
}

function SharedPackingRow({ tripId, item, myKey, memberCount }) {
  const checkedMap = item.checkedBy || {};
  const myChecked = Boolean(checkedMap[myKey]);
  const confirmedCount = Object.keys(checkedMap).filter(function (k) { return checkedMap[k]; }).length;

  function toggleChecked() {
    const patch = {};
    patch["checkedBy." + myKey] = !myChecked;
    db.doc("trips/" + tripId + "/packingItems/" + item.id).update(patch);
  }

  function handleDelete() {
    db.doc("trips/" + tripId + "/packingItems/" + item.id).delete();
  }

  function handleRename(newName) {
    db.doc("trips/" + tripId + "/packingItems/" + item.id).update({ name: newName });
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-50 last:border-b-0">
      <button
        onClick={toggleChecked}
        aria-label={myChecked ? "取消勾選" : "勾選已帶"}
        className={
          "shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm " +
          (myChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-amber-300 text-transparent")
        }
      >
        ✓
      </button>
      <div className="flex-1 min-w-0">
        <PackingItemName name={item.name} checked={myChecked} onSave={handleRename} />
        <span className="text-[11px] text-slate-400 ml-1.5 inline-flex items-center gap-0.5">
          <GlobeIcon className="w-3 h-3" /> 共同 · {confirmedCount}/{Math.max(memberCount, 1)} 人已確認
        </span>
      </div>
      <button onClick={handleDelete} className="shrink-0 min-h-[36px] px-2 text-xs text-red-400">刪除</button>
    </div>
  );
}

function PrivatePackingRow({ tripId, item }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-50 last:border-b-0">
      <button
        onClick={function () { togglePrivatePackingItem(tripId, item); }}
        aria-label={item.checked ? "取消勾選" : "勾選已帶"}
        className={
          "shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm " +
          (item.checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-amber-300 text-transparent")
        }
      >
        ✓
      </button>
      <div className="flex-1 min-w-0">
        <PackingItemName
          name={item.name}
          checked={item.checked}
          onSave={function (newName) { renamePrivatePackingItem(tripId, item.id, newName); }}
        />
        <span className="text-[11px] text-slate-400 ml-1.5 inline-flex items-center gap-0.5">
          <LockIcon className="w-3 h-3" /> 只有我
        </span>
      </div>
      <button onClick={function () { removePrivatePackingItem(tripId, item.id); }} className="shrink-0 min-h-[36px] px-2 text-xs text-red-400">
        刪除
      </button>
    </div>
  );
}

const PACKING_PRESETS = ["護照", "簽證／機票證明", "手機充電器", "轉接頭", "行動電源", "常備藥品", "盥洗用具", "換洗衣物", "雨具", "太陽眼鏡"];

function PackingListPage({ tripId, nickname }) {
  const auth = useAuth();
  const { data: sharedItems, loading } = useCollection("trips/" + tripId + "/packingItems");
  const { data: members } = useCollection("trips/" + tripId + "/members");
  const privateItems = usePrivatePackingItems(tripId);
  const [name, setName] = React.useState("");
  const [shareAll, setShareAll] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // 用 Google 登入後，看看這台裝置上還有沒有「登入前」留下的個人項目，讓使用者可以一鍵搬到帳號上
  const [localLeftover, setLocalLeftover] = React.useState(function () { return readPrivatePackingItems(tripId); });
  const [migrating, setMigrating] = React.useState(false);
  React.useEffect(function () {
    function refresh() { setLocalLeftover(readPrivatePackingItems(tripId)); }
    refresh();
    privatePackingListeners.push(refresh);
    return function () {
      const idx = privatePackingListeners.indexOf(refresh);
      if (idx >= 0) privatePackingListeners.splice(idx, 1);
    };
  }, [tripId]);

  async function handleMigrate() {
    setMigrating(true);
    await migratePrivatePackingToCloud(tripId);
    setMigrating(false);
  }

  const myKey = sanitizeMemberId(nickname);
  const memberCount = members.length;

  const rows = sharedItems
    .map(function (i) { return { kind: "shared", data: i, createdAt: toMillis(i.createdAt) }; })
    .concat(privateItems.map(function (i) { return { kind: "private", data: i, createdAt: toMillis(i.createdAt) }; }))
    .sort(function (a, b) { return a.createdAt - b.createdAt; });

  const existingNames = rows.map(function (r) { return r.data.name; });
  const totalCount = rows.length;
  const doneCount = rows.filter(function (r) {
    return r.kind === "private" ? r.data.checked : Boolean(r.data.checkedBy && r.data.checkedBy[myKey]);
  }).length;

  async function addItem(itemName, shared) {
    const trimmed = (itemName || "").trim();
    if (!trimmed) return;
    if (shared) {
      setSaving(true);
      try {
        await db.collection("trips/" + tripId + "/packingItems").add({
          name: trimmed,
          addedBy: nickname || "匿名",
          checkedBy: {},
          createdAt: firebase.firestore.Timestamp.now(),
        });
        setName("");
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    } else {
      addPrivatePackingItem(tripId, trimmed);
      setName("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    addItem(name, shareAll);
  }

  const availablePresets = PACKING_PRESETS.filter(function (p) { return existingNames.indexOf(p) < 0; });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
        <BagIcon className="w-5 h-5 text-brand-600" /> 行李清單
        {totalCount > 0 && <span className="text-sm font-normal text-slate-400">（我已收 {doneCount} / {totalCount}）</span>}
      </h2>

      {auth.isGoogle && localLeftover.length > 0 && (
        <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-sm text-sky-800 flex items-center justify-between gap-2 flex-wrap">
          <span>這台裝置上有 {localLeftover.length} 筆個人項目是登入前新增的，還沒同步到你的帳號，別的裝置看不到</span>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="shrink-0 min-h-[36px] px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
          >
            {migrating ? "同步中..." : "同步到帳號"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-amber-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="新增物品，例如：護照"
            value={name}
            onChange={function (e) { setName(e.target.value); }}
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="min-h-[44px] px-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium"
          >
            新增
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={function () { setShareAll(true); }}
            className={"flex-1 min-h-[36px] rounded-lg text-xs border " + (shareAll ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")}
          >
            共同（提醒大家都要帶，各自打勾）
          </button>
          <button
            type="button"
            onClick={function () { setShareAll(false); }}
            className={"flex-1 min-h-[36px] rounded-lg text-xs border " + (!shareAll ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")}
          >
            個人（只有我看得到）
          </button>
        </div>
      </form>

      {availablePresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availablePresets.map(function (p) {
            return (
              <button
                key={p}
                onClick={function () { addItem(p, shareAll); }}
                className="min-h-[32px] px-2.5 rounded-full text-xs border border-amber-200 text-slate-600 bg-white active:bg-amber-50"
              >
                ＋ {p}
              </button>
            );
          })}
        </div>
      )}

      {loading && <p className="text-slate-400 text-sm">載入中...</p>}
      {!loading && totalCount === 0 && <p className="text-slate-400 text-sm">還沒有加入任何物品，用上面的常用項目快速加入吧！</p>}

      {totalCount > 0 && (
        <div className="bg-white rounded-xl border border-amber-100">
          {rows.map(function (r) {
            return r.kind === "shared" ? (
              <SharedPackingRow key={"s-" + r.data.id} tripId={tripId} item={r.data} myKey={myKey} memberCount={memberCount} />
            ) : (
              <PrivatePackingRow key={"p-" + r.data.id} tripId={tripId} item={r.data} />
            );
          })}
        </div>
      )}
    </div>
  );
}
