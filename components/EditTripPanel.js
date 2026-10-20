// 建立行程時如果選了「日期還沒定」，一開始「行程」分頁是空的——要等使用者把某個地點排進某一天，
// 才會第一次出現「一天」。這會讓人誤以為行程被鎖死只能有那一天。這個面板讓使用者隨時回來
// 補上/修改正式日期：一旦補上 startDate~endDate，「行程」分頁就會照整個日期範圍顯示所有天，
// 不再只看已經排了項目的那幾天。欄位設計跟 Home.js 建立行程時的表單一致，維持同一套邏輯。
function EditTripPanel({ tripId, trip, onClose }) {
  const [name, setName] = React.useState(trip.name || "");
  const [destination, setDestination] = React.useState(trip.destination || "");
  const [dateMode, setDateMode] = React.useState(trip.startDate ? "known" : "undecided");
  const [startDate, setStartDate] = React.useState(trip.startDate || "");
  const [endDate, setEndDate] = React.useState(trip.endDate || "");
  const [approxDays, setApproxDays] = React.useState(trip.approxDays ? String(trip.approxDays) : "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("請幫這趟行程取個名字");
      return;
    }
    if (dateMode === "known") {
      if (!startDate || !endDate) {
        setError("請選擇開始和結束日期，或改選「日期還沒定」");
        return;
      }
      if (endDate < startDate) {
        setError("結束日期不能早於開始日期");
        return;
      }
    }
    const parsedApproxDays = parseInt(approxDays, 10);
    setSaving(true);
    setError(null);
    try {
      await db.doc("trips/" + tripId).update({
        name: name.trim(),
        destination: destination.trim(),
        startDate: dateMode === "known" ? startDate : null,
        endDate: dateMode === "known" ? endDate : null,
        approxDays: dateMode === "undecided" && parsedApproxDays > 0 ? parsedApproxDays : null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("儲存失敗，請稍後再試。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[88vh] overflow-y-auto"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="sticky top-0 bg-white border-b border-amber-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <PencilIcon className="w-4 h-4 text-brand-600" /> 編輯行程資訊
          </h3>
          <button onClick={onClose} className="text-slate-400 w-8 h-8 flex items-center justify-center" aria-label="關閉">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">行程名稱</label>
            <input
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={name}
              onChange={function (e) { setName(e.target.value); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">目的地（選填）</label>
            <input
              className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              value={destination}
              onChange={function (e) { setDestination(e.target.value); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">日期</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={function () { setDateMode("known"); }}
                className={
                  "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition " +
                  (dateMode === "known" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                }
              >
                知道確切日期
              </button>
              <button
                type="button"
                onClick={function () { setDateMode("undecided"); }}
                className={
                  "flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition " +
                  (dateMode === "undecided" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                }
              >
                日期還沒定
              </button>
            </div>
          </div>

          {dateMode === "known" ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">開始日期 *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={startDate}
                  onChange={function (e) { setStartDate(e.target.value); }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">結束日期 *</label>
                <input
                  type="date"
                  required
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={endDate}
                  onChange={function (e) { setEndDate(e.target.value); }}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">大概幾天？（選填）</label>
              <input
                type="number"
                min="1"
                max="60"
                inputMode="numeric"
                className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                value={approxDays}
                onChange={function (e) { setApproxDays(e.target.value); }}
                placeholder="例如：5"
              />
              {trip.startDate && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
                  改回「日期還沒定」會把目前「行程」分頁裡依日期排好的項目保留在原本的日期上，只是分頁不再自動顯示整個範圍的每一天。
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 transition"
          >
            {saving ? "儲存中..." : "儲存"}
          </button>
        </form>
      </div>
    </div>
  );
}
