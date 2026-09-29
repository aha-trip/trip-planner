// 新增一筆消費（底部滑出視窗）。defaults 可以帶入從行程卡片點進來時要預填的地點/日期。
function ExpenseForm({ tripId, nickname, memberNames, defaults, onClose }) {
  const d = defaults || {};
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("TWD");
  const [category, setCategory] = React.useState("food");
  const [payer, setPayer] = React.useState(nickname || (memberNames && memberNames[0]) || "");
  const [shared, setShared] = React.useState(true);
  const [note, setNote] = React.useState(d.note || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function handleSave() {
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      setError("請輸入正確的金額");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await db.collection("trips/" + tripId + "/expenses").add({
        amount: value,
        currency: currency,
        category: category,
        payer: payer.trim() || "匿名",
        shared: shared,
        note: note.trim(),
        date: d.date || null,
        linkedItineraryItemId: d.linkedItineraryItemId || null,
        linkedWishlistItemId: d.linkedWishlistItemId || null,
        addedBy: nickname || "匿名",
        createdAt: firebase.firestore.Timestamp.now(),
      });
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
          <h2 className="text-lg font-bold text-slate-800">新增消費</h2>
          <button onClick={onClose} className="w-10 h-10 -mr-2 text-slate-400 text-2xl leading-none" aria-label="關閉">×</button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={inputClass + " flex-1"}
              placeholder="金額"
              value={amount}
              onChange={function (e) { setAmount(e.target.value); }}
            />
            <div className="w-36 shrink-0">
              <CurrencyPicker value={currency} onChange={setCurrency} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">分類</label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORY_OPTIONS.map(function (c) {
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
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">付款人</label>
            {memberNames && memberNames.length > 0 ? (
              <select className={inputClass} value={payer} onChange={function (e) { setPayer(e.target.value); }}>
                {memberNames.indexOf(payer) < 0 && payer && <option value={payer}>{payer}</option>}
                {memberNames.map(function (m) { return <option key={m} value={m}>{m}</option>; })}
              </select>
            ) : (
              <input className={inputClass} value={payer} onChange={function (e) { setPayer(e.target.value); }} />
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">分攤方式</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={function () { setShared(true); }}
                className={"flex-1 min-h-[40px] rounded-lg text-sm border " + (shared ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")}
              >
                共同（大家平分）
              </button>
              <button
                type="button"
                onClick={function () { setShared(false); }}
                className={"flex-1 min-h-[40px] rounded-lg text-sm border " + (!shared ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")}
              >
                個人（只算自己）
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">備註（選填）</label>
            <input className={inputClass} value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="例如：晚餐、伴手禮" />
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
