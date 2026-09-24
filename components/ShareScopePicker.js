// 分享範圍選擇：所有人 / 指定對象 / 只有我（新增購物項目、事後修改都共用這一個）
const SHARE_MODES = [
  { key: "everyone", label: "所有人", Icon: GlobeIcon },
  { key: "specific", label: "指定對象", Icon: PeopleIcon },
  { key: "private", label: "只有我", Icon: LockIcon },
];

function ShareScopePicker({ tripId, nickname, mode, onModeChange, selectedMembers, onMembersChange }) {
  const { data: members } = useCollection("trips/" + tripId + "/members");
  const otherMembers = members.filter(function (m) { return m.nickname !== nickname; });

  function toggleMember(name) {
    onMembersChange(
      selectedMembers.indexOf(name) >= 0
        ? selectedMembers.filter(function (n) { return n !== name; })
        : selectedMembers.concat([name])
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {SHARE_MODES.map(function (m) {
          const active = mode === m.key;
          return (
            <button
              type="button"
              key={m.key}
              onClick={function () { onModeChange(m.key); }}
              className={
                "min-h-[44px] flex items-center justify-center gap-1 px-1 rounded-lg text-sm font-medium border transition " +
                (active ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 bg-white")
              }
            >
              <m.Icon className="w-4 h-4" /> {m.label}
            </button>
          );
        })}
      </div>

      {mode === "specific" && (
        <div className="mt-2 p-2 rounded-lg bg-cream border border-amber-100">
          {otherMembers.length === 0 ? (
            <p className="text-xs text-slate-400">還沒有其他成員的資料，等他們打開這個行程連結、設定暱稱後就會出現在這裡。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {otherMembers.map(function (m) {
                const checked = selectedMembers.indexOf(m.nickname) >= 0;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={function () { toggleMember(m.nickname); }}
                    className={
                      "min-h-[40px] px-3 rounded-full text-sm font-medium border transition " +
                      (checked ? "bg-brand-500 border-brand-500 text-white" : "border-amber-200 text-slate-600 bg-white")
                    }
                  >
                    {checked ? "✓ " : ""}{m.nickname}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">
            提醒：這個 App 沒有帳號登入，「指定對象」是依暱稱過濾畫面顯示，不是真正加密隔離。
          </p>
        </div>
      )}
      {mode === "private" && (
        <p className="text-xs text-slate-400 mt-2">這個只會存在你這個瀏覽器，不會同步給其他行程成員。</p>
      )}
    </div>
  );
}
