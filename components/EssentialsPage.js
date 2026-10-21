// O5「旅途必備資訊卡」：住宿地址、緊急聯絡方式、保險資訊集中一頁，離線也看得到
// （跟其他行程資料一樣受 O2/O3 的離線快取保護）。「給司機看」用大字顯示飯店名稱/地址，
// 計程車司機一眼就看懂，不用比手畫腳。
function EssentialsCard({ label, big, onDriverView }) {
  return (
    <div className="bg-white rounded-xl border border-amber-100 p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800 break-words">{big || "尚未填寫"}</p>
      {big && onDriverView && (
        <button onClick={onDriverView} className="mt-2 text-xs text-brand-600 font-medium">🚕 給司機看（大字顯示）</button>
      )}
    </div>
  );
}

function DriverView({ title, text, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-lg" aria-label="關閉">✕</button>
      <p className="text-sm text-slate-400 mb-3">{title}</p>
      <p className="text-3xl font-bold text-slate-900 text-center break-words leading-relaxed">{text}</p>
    </div>
  );
}

function EssentialsPage({ tripId, nickname }) {
  const { data: info, loading } = useDocument("trips/" + tripId + "/essentials/main");
  const [editing, setEditing] = React.useState(false);
  const [driverView, setDriverView] = React.useState(null);
  const [form, setForm] = React.useState(null);

  function startEdit() {
    setForm({
      hotelName: (info && info.hotelName) || "",
      hotelAddress: (info && info.hotelAddress) || "",
      emergencyContactsText: (info && (info.emergencyContacts || []).join("\n")) || "",
      insuranceCompany: (info && info.insuranceCompany) || "",
      insurancePhone: (info && info.insurancePhone) || "",
      insurancePolicyNumber: (info && info.insurancePolicyNumber) || "",
    });
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    await db.doc("trips/" + tripId + "/essentials/main").set({
      hotelName: form.hotelName.trim(),
      hotelAddress: form.hotelAddress.trim(),
      emergencyContacts: form.emergencyContactsText.split("\n").map(function (s) { return s.trim(); }).filter(Boolean),
      insuranceCompany: form.insuranceCompany.trim(),
      insurancePhone: form.insurancePhone.trim(),
      insurancePolicyNumber: form.insurancePolicyNumber.trim(),
      updatedBy: nickname || "匿名",
      updatedAt: firebase.firestore.Timestamp.now(),
    }, { merge: true });
    setEditing(false);
  }

  if (loading) return <p className="text-slate-400 text-sm">載入中...</p>;

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-3 bg-white rounded-xl border border-amber-100 p-4">
        <h2 className="text-lg font-bold text-slate-800">編輯必備資訊</h2>
        <div>
          <label className="block text-xs text-slate-500 mb-1">飯店名稱</label>
          <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.hotelName} onChange={function (e) { setForm(Object.assign({}, form, { hotelName: e.target.value })); }} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">飯店地址（建議填當地語言，給司機看才看得懂）</label>
          <textarea className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" rows={2} value={form.hotelAddress} onChange={function (e) { setForm(Object.assign({}, form, { hotelAddress: e.target.value })); }} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">緊急聯絡方式（一行一個，例如：當地警察 110／台灣駐外單位 +81-xx-xxxx）</label>
          <textarea className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" rows={3} value={form.emergencyContactsText} onChange={function (e) { setForm(Object.assign({}, form, { emergencyContactsText: e.target.value })); }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">保險公司</label>
            <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.insuranceCompany} onChange={function (e) { setForm(Object.assign({}, form, { insuranceCompany: e.target.value })); }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">急難救助電話</label>
            <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.insurancePhone} onChange={function (e) { setForm(Object.assign({}, form, { insurancePhone: e.target.value })); }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">保單號碼</label>
            <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.insurancePolicyNumber} onChange={function (e) { setForm(Object.assign({}, form, { insurancePolicyNumber: e.target.value })); }} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={function () { setEditing(false); }} className="flex-1 rounded-lg border border-amber-200 text-slate-600 text-sm font-medium py-2.5">取消</button>
          <button type="submit" className="flex-[2] rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2.5">儲存</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">📋 必備資訊</h2>
        <button onClick={startEdit} className="text-sm text-brand-600 font-medium flex items-center gap-1">
          <PencilIcon className="w-3.5 h-3.5" /> 編輯
        </button>
      </div>
      <p className="text-xs text-slate-400">旅途中最常被翻出來的資訊集中在這裡，離線也看得到。</p>

      <EssentialsCard
        label="🏨 飯店地址"
        big={info && info.hotelAddress}
        onDriverView={info && info.hotelAddress ? function () { setDriverView({ title: info.hotelName || "飯店地址", text: info.hotelAddress }); } : null}
      />

      <div className="bg-white rounded-xl border border-amber-100 p-4">
        <p className="text-xs text-slate-400 mb-1">🚨 緊急聯絡方式</p>
        {info && info.emergencyContacts && info.emergencyContacts.length > 0 ? (
          <ul className="text-sm text-slate-700 space-y-1">
            {info.emergencyContacts.map(function (c, i) { return <li key={i}>{c}</li>; })}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">尚未填寫</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-amber-100 p-4">
        <p className="text-xs text-slate-400 mb-1">🛡️ 保險資訊</p>
        {info && (info.insuranceCompany || info.insurancePhone || info.insurancePolicyNumber) ? (
          <div className="text-sm text-slate-700 space-y-0.5">
            {info.insuranceCompany && <p>保險公司：{info.insuranceCompany}</p>}
            {info.insurancePhone && <p>急難救助：{info.insurancePhone}</p>}
            {info.insurancePolicyNumber && <p>保單號碼：{info.insurancePolicyNumber}</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-400">尚未填寫</p>
        )}
      </div>

      {driverView && <DriverView title={driverView.title} text={driverView.text} onClose={function () { setDriverView(null); }} />}
    </div>
  );
}
