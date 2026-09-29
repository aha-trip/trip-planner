function formatMoney(n) {
  return n.toLocaleString("zh-Hant", { maximumFractionDigits: 2 });
}

function ExpenseRow({ tripId, expense }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  function handleDelete() {
    db.doc("trips/" + tripId + "/expenses/" + expense.id).update({ deletedAt: firebase.firestore.Timestamp.now() });
    showUndoToast("已刪除這筆消費", function () {
      db.doc("trips/" + tripId + "/expenses/" + expense.id).update({ deletedAt: null });
    });
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-amber-50 last:border-b-0">
      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
        {EXPENSE_CATEGORY_LABELS[expense.category] || expense.category}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">
          {expense.note || EXPENSE_CATEGORY_LABELS[expense.category]}
        </p>
        <p className="text-xs text-slate-400">
          {expense.payer} 付款 · {expense.shared ? "共同" : "個人"}{expense.date ? " · " + expense.date.slice(5) : ""}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-slate-800">{formatMoney(expense.amount)} {expense.currency}</p>
      {confirmDelete ? (
        <span className="shrink-0 text-xs">
          <button onClick={handleDelete} className="min-h-[36px] px-2 text-red-600 font-medium">刪除</button>
          <button onClick={function () { setConfirmDelete(false); }} className="min-h-[36px] px-1 text-slate-400">取消</button>
        </span>
      ) : (
        <button onClick={function () { setConfirmDelete(true); }} className="shrink-0 min-h-[36px] px-2 text-xs text-red-400">刪除</button>
      )}
    </div>
  );
}

function CurrencySummary({ currency, bucket, memberCount }) {
  const payers = Object.keys(bucket.paidByPayer);
  const categories = Object.keys(bucket.categoryTotals);
  const perHead = memberCount > 0 ? bucket.shared / memberCount : 0;

  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4 space-y-3">
      <h3 className="font-bold text-slate-800">{currency}</h3>

      <div>
        <p className="text-xs text-slate-500">共同花費（大家平分）</p>
        <p className="text-lg font-bold text-brand-700">
          {formatMoney(bucket.shared)} {currency}
          {memberCount > 0 && <span className="text-xs font-normal text-slate-400"> ・平均每人 {formatMoney(perHead)}</span>}
        </p>
      </div>

      {payers.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1">各自付款總額（含共同＋個人）</p>
          <div className="space-y-0.5">
            {payers.map(function (p) {
              return (
                <p key={p} className="text-sm text-slate-700 flex justify-between">
                  <span>{p}</span>
                  <span className="font-medium">{formatMoney(bucket.paidByPayer[p])} {currency}</span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-1">分類明細</p>
          <div className="space-y-0.5">
            {categories.map(function (c) {
              return (
                <p key={c} className="text-sm text-slate-600 flex justify-between">
                  <span>{EXPENSE_CATEGORY_LABELS[c] || c}</span>
                  <span>{formatMoney(bucket.categoryTotals[c])} {currency}</span>
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ExpensesPage({ tripId, nickname }) {
  const { data: rawExpenses, loading } = useCollection("trips/" + tripId + "/expenses");
  const { data: members } = useCollection("trips/" + tripId + "/members");
  const [showAddForm, setShowAddForm] = React.useState(false);

  const expenses = rawExpenses
    .filter(function (e) { return !e.deletedAt; })
    .sort(function (a, b) {
      const ta = a.createdAt ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

  const memberNames = members.map(function (m) { return m.nickname; }).filter(Boolean);

  const byCurrency = {};
  expenses.forEach(function (e) {
    if (!byCurrency[e.currency]) byCurrency[e.currency] = { shared: 0, paidByPayer: {}, categoryTotals: {} };
    const bucket = byCurrency[e.currency];
    bucket.paidByPayer[e.payer] = (bucket.paidByPayer[e.payer] || 0) + e.amount;
    bucket.categoryTotals[e.category] = (bucket.categoryTotals[e.category] || 0) + e.amount;
    if (e.shared) bucket.shared += e.amount;
  });
  const currencies = Object.keys(byCurrency);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <ReceiptIcon className="w-5 h-5 text-brand-600" /> 花費總覽
        </h2>
        <button
          onClick={function () { setShowAddForm(true); }}
          className="min-h-[40px] px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
        >
          ＋ 新增消費
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">載入中...</p>}
      {!loading && expenses.length === 0 && (
        <p className="text-slate-400 text-sm">還沒有記錄任何消費。沒有連匯率 API，不同幣別會分開加總。</p>
      )}

      {currencies.length > 0 && (
        <div className="space-y-3">
          {currencies.map(function (cur) {
            return <CurrencySummary key={cur} currency={cur} bucket={byCurrency[cur]} memberCount={memberNames.length} />;
          })}
        </div>
      )}

      {expenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2">所有紀錄</h3>
          <div className="bg-white rounded-xl border border-amber-100">
            {expenses.map(function (e) { return <ExpenseRow key={e.id} tripId={tripId} expense={e} />; })}
          </div>
        </div>
      )}

      {showAddForm && (
        <ExpenseForm
          tripId={tripId}
          nickname={nickname}
          memberNames={memberNames}
          onClose={function () { setShowAddForm(false); }}
        />
      )}
    </div>
  );
}
