// 預約規則庫後台：#/admin/booking-rules，只有 config.js 設定的 adminEmail 那個 Google 帳號能用。
// 真正擋住別人改資料的是 firestore.rules.txt 裡的 isAdmin()，這個頁面的 email 檢查只是
// 「不要讓其他人看到一個改了也沒用、徒增困惑的畫面」，兩邊都要擋才完整。
const RULE_FORM_BLANK = {
  id: "",
  aliasesText: "",
  city: "",
  ruleType: "rolling",
  openDayOfMonth: "",
  openTime: "",
  timezone: "Asia/Tokyo",
  openRuleText: "",
  difficulty: "",
  bookingUrl: "",
  tips: "",
  sourceUrl: "",
  verified: false,
};

function ruleToForm(rule) {
  return {
    id: rule.id || "",
    aliasesText: (rule.aliases || []).join("\n"),
    city: rule.city || "",
    ruleType: rule.ruleType || "rolling",
    openDayOfMonth: rule.openDayOfMonth != null ? String(rule.openDayOfMonth) : "",
    openTime: rule.openTime || "",
    timezone: rule.timezone || "Asia/Tokyo",
    openRuleText: rule.openRuleText || "",
    difficulty: rule.difficulty || "",
    bookingUrl: rule.bookingUrl || "",
    tips: rule.tips || "",
    sourceUrl: rule.sourceUrl || "",
    verified: Boolean(rule.verified),
  };
}

function formToDoc(form) {
  const doc = {
    aliases: form.aliasesText.split("\n").map(function (s) { return s.trim(); }).filter(Boolean),
    city: form.city.trim(),
    ruleType: form.ruleType,
    openRuleText: form.openRuleText.trim(),
    difficulty: form.difficulty.trim(),
    bookingUrl: form.bookingUrl.trim(),
    tips: form.tips.trim(),
    sourceUrl: form.sourceUrl.trim(),
    verified: Boolean(form.verified),
  };
  if (form.ruleType === "fixed-monthly") {
    doc.openDayOfMonth = parseInt(form.openDayOfMonth, 10) || null;
    doc.openTime = form.openTime.trim();
    doc.timezone = form.timezone.trim();
  } else {
    doc.openDayOfMonth = null;
    doc.openTime = null;
    doc.timezone = null;
  }
  return doc;
}

function RuleForm({ initial, onCancel, onSave }) {
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  function set(field, value) { setForm(Object.assign({}, form, { [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.id.trim()) { window.alert("請填規則代號（id），例如 ghibli-museum"); return; }
    if (!form.aliasesText.trim()) { window.alert("請至少填一個比對用的地點名稱關鍵字"); return; }
    setSaving(true);
    try {
      await onSave(form.id.trim(), formToDoc(form));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-amber-100 p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">規則代號（id，新增後不能改）</label>
        <input
          className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
          value={form.id}
          disabled={Boolean(initial.id)}
          onChange={function (e) { set("id", e.target.value); }}
          placeholder="例如：ghibli-museum"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">比對用的地點名稱關鍵字（一行一個）</label>
        <textarea
          className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
          rows={3}
          value={form.aliasesText}
          onChange={function (e) { set("aliasesText", e.target.value); }}
          placeholder={"吉卜力美術館\n三鷹の森ジブリ美術館"}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">城市</label>
          <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.city} onChange={function (e) { set("city", e.target.value); }} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">搶手程度</label>
          <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.difficulty} onChange={function (e) { set("difficulty", e.target.value); }} placeholder="秒殺／當天滿／通常有位" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">開放方式</label>
        <div className="flex gap-1.5">
          <button type="button" onClick={function () { set("ruleType", "rolling"); }} className={"flex-1 px-3 py-2 rounded-lg text-sm font-medium border " + (form.ruleType === "rolling" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600")}>
            沒有固定開放日
          </button>
          <button type="button" onClick={function () { set("ruleType", "fixed-monthly"); }} className={"flex-1 px-3 py-2 rounded-lg text-sm font-medium border " + (form.ruleType === "fixed-monthly" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600")}>
            每月固定日開放
          </button>
        </div>
      </div>
      {form.ruleType === "fixed-monthly" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">每月幾號開放</label>
            <input type="number" min="1" max="31" className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.openDayOfMonth} onChange={function (e) { set("openDayOfMonth", e.target.value); }} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">開放時間（當地）</label>
            <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.openTime} onChange={function (e) { set("openTime", e.target.value); }} placeholder="10:00" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">時區</label>
            <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.timezone} onChange={function (e) { set("timezone", e.target.value); }} placeholder="Asia/Tokyo" />
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">開放規則說明（顯示給使用者看）</label>
        <textarea className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" rows={2} value={form.openRuleText} onChange={function (e) { set("openRuleText", e.target.value); }} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">搶票提示</label>
        <textarea className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" rows={2} value={form.tips} onChange={function (e) { set("tips", e.target.value); }} />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">官方預約連結</label>
          <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.bookingUrl} onChange={function (e) { set("bookingUrl", e.target.value); }} />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">資料來源連結</label>
          <input className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm" value={form.sourceUrl} onChange={function (e) { set("sourceUrl", e.target.value); }} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.verified} onChange={function (e) { set("verified", e.target.checked); }} />
        已經人工核對過這條規則（核對過才不會顯示「還沒核對」的警語給使用者看）
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-amber-200 text-slate-600 text-sm font-medium py-2.5">取消</button>
        <button type="submit" disabled={saving} className="flex-[2] rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2.5">
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </form>
  );
}

function AdminBookingRulesPage() {
  const auth = useAuth();
  const { data: rules, loading } = useCollection("bookingRules");
  const [editingId, setEditingId] = React.useState(null); // null=沒開表單，""=新增，其他=編輯中的 id
  const [importing, setImporting] = React.useState(false);

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch (err) {
      window.alert(describeAuthError(err) || "登入失敗");
    }
  }

  async function handleSave(id, docData) {
    await db.collection("bookingRules").doc(id).set(docData);
    setEditingId(null);
  }

  async function handleDelete(id) {
    if (!window.confirm("刪除這條規則？")) return;
    await db.collection("bookingRules").doc(id).delete();
  }

  async function handleImportDefaults() {
    setImporting(true);
    try {
      const batch = db.batch();
      DEFAULT_BOOKING_RULES.forEach(function (rule) {
        const ref = db.collection("bookingRules").doc(rule.id);
        const docData = Object.assign({}, rule);
        delete docData.id;
        batch.set(ref, docData);
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
      window.alert("匯入失敗，請稍後再試。");
    } finally {
      setImporting(false);
    }
  }

  if (!auth.isGoogle) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-3">
          <p className="text-slate-600">這個頁面需要用管理員的 Google 帳號登入。</p>
          <button onClick={handleSignIn} className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5">
            用 Google 登入
          </button>
        </div>
      </div>
    );
  }

  if (!CONFIG.adminEmail || auth.user.email !== CONFIG.adminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-slate-600 text-center">這個帳號沒有權限進入這個頁面。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-slate-800">預約規則庫後台</h1>
        <p className="text-sm text-slate-500">
          這裡維護的內容會即時同步到所有使用者的「準備」分頁雷達比對。改完不用重新部署網站，存檔就生效。
        </p>

        {!loading && rules.length === 0 && (
          <button
            onClick={handleImportDefaults}
            disabled={importing}
            className="rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-2.5"
          >
            {importing ? "匯入中..." : "目前還沒有任何規則，先匯入內建的預設規則"}
          </button>
        )}

        {editingId === "" ? (
          <RuleForm initial={RULE_FORM_BLANK} onCancel={function () { setEditingId(null); }} onSave={handleSave} />
        ) : (
          <button onClick={function () { setEditingId(""); }} className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5">
            ＋ 新增規則
          </button>
        )}

        {loading && <p className="text-slate-400 text-sm">載入中...</p>}

        <div className="space-y-2">
          {rules.map(function (rule) {
            if (editingId === rule.id) {
              return <RuleForm key={rule.id} initial={ruleToForm(rule)} onCancel={function () { setEditingId(null); }} onSave={handleSave} />;
            }
            return (
              <div key={rule.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {rule.id} {rule.verified ? (
                      <span className="text-emerald-600 text-xs inline-flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" /> 已核對</span>
                    ) : (
                      <span className="text-amber-600 text-xs inline-flex items-center gap-1"><AlertIcon className="w-3.5 h-3.5" /> 未核對</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{(rule.aliases || []).join("、")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rule.openRuleText}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={function () { setEditingId(rule.id); }} className="min-h-[32px] px-3 rounded-lg border border-amber-200 text-xs text-slate-600">編輯</button>
                  <button onClick={function () { handleDelete(rule.id); }} className="min-h-[32px] px-3 rounded-lg border border-red-200 text-xs text-red-600">刪除</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
