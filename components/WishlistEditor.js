// 編輯願望清單地點的名稱、地址、類別、備註（手機上從底部滑出）
function WishlistEditor({ tripId, item, onClose }) {
  const [name, setName] = React.useState(item.name || "");
  const [address, setAddress] = React.useState(item.address || "");
  const [category, setCategory] = React.useState(item.category || "sight");
  const [notes, setNotes] = React.useState(item.notes || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("名稱不能空白");
      return;
    }
    setSaving(true);
    setError(null);
    const patch = {
      name: name.trim(),
      address: address.trim(),
      category: category,
      notes: notes.trim(),
    };
    // 名稱或地址改了，原本查到的座標就不準了，清掉讓「附近的地點」重新查
    if (patch.name !== (item.name || "") || patch.address !== (item.address || "")) {
      patch.lat = null;
      patch.lng = null;
      patch.placeId = null;
    }
    try {
      await db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update(patch);
      onClose();
    } catch (err) {
      console.error(err);
      setError("儲存失敗：" + (err.message || "請稍後再試"));
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-amber-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 max-h-[90vh] overflow-y-auto"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">編輯地點</h2>
          <button onClick={onClose} className="w-10 h-10 -mr-2 text-slate-400 text-2xl leading-none" aria-label="關閉">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">名稱</label>
            <input className={inputClass} value={name} onChange={function (e) { setName(e.target.value); }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">地址（改了地址，附近地點會重新查座標）</label>
            <input className={inputClass} value={address} onChange={function (e) { setAddress(e.target.value); }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">類別</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map(function (c) {
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={function () { setCategory(c); }}
                    className={
                      "min-h-[40px] px-3 rounded-full text-sm border transition " +
                      (category === c ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")
                    }
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備註（網址會變成可點的連結）</label>
            <textarea className={inputClass} rows={4} value={notes} onChange={function (e) { setNotes(e.target.value); }} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 min-h-[48px] rounded-lg border border-amber-200 text-slate-600">取消</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 min-h-[48px] rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}
