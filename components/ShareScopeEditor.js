// 事後修改購物項目的分享範圍（手機上從底部滑出的面板）
function ShareScopeEditor({ tripId, item, nickname, onClose }) {
  const [mode, setMode] = React.useState(scopeOfItem(item));
  const [selectedMembers, setSelectedMembers] = React.useState(item.visibleTo || []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function handleSave() {
    if (mode === "specific" && selectedMembers.length === 0) {
      setError("請至少選一位要分享的對象，或改選其他分享範圍");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode !== scopeOfItem(item) || mode === "specific") {
        await changeShoppingScope(tripId, item, mode, selectedMembers);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("修改失敗，請稍後再試。");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 pb-8 sm:pb-5 max-h-[85vh] overflow-y-auto"
        onClick={function (e) { e.stopPropagation(); }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">修改分享範圍</h2>
          <button onClick={onClose} className="w-10 h-10 -mr-2 text-slate-400 text-2xl leading-none" aria-label="關閉">×</button>
        </div>
        <ShareScopePicker
          tripId={tripId}
          nickname={nickname}
          mode={mode}
          onModeChange={setMode}
          selectedMembers={selectedMembers}
          onMembersChange={setSelectedMembers}
        />
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[48px] mt-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium transition"
        >
          {saving ? "儲存中..." : "儲存"}
        </button>
      </div>
    </div>
  );
}
