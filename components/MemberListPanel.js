// 顯示行程成員名單，建立行程的人（isCreator）可以移除名單上的人
// 也讓建立者切換這趟行程的編輯權限（有連結就能編輯 / 只有 Google 登入的人能編輯）。
// 注意：「移除」只是清掉「成員清單」這筆記錄，不是真的收回對方的存取權限（拿到連結的人
// 還是能重新加入），主要是讓「指定對象分享」的選單保持乾淨。
function MemberListPanel({ tripId, isCreator, creatorDeviceId, accessMode, onClose }) {
  const { data: members } = useCollection(
    "trips/" + tripId + "/members",
    function (ref) { return ref.orderBy("lastSeenAt", "desc"); }
  );
  const auth = useAuth();
  const [savingMode, setSavingMode] = React.useState(false);

  // 切換這趟行程的編輯權限："link" = 有連結就能編輯；"google" = 只有 Google 登入的人能編輯
  async function handleChangeMode(mode) {
    if (mode === accessMode || savingMode) return;
    setSavingMode(true);
    try {
      // 要限定 Google 登入，建立者自己得先登入，否則設定完連自己都不能編輯了
      if (mode === "google" && !auth.isGoogle) await signInWithGoogle();
      await db.doc("trips/" + tripId).update({ accessMode: mode });
    } catch (err) {
      console.error(err);
      const msg = describeAuthError(err);
      if (msg !== null) {
        window.alert(
          err && err.code === "permission-denied"
            ? "沒有權限切換：請用建立這趟行程的帳號（或那台裝置）操作。"
            : msg
        );
      }
    } finally {
      setSavingMode(false);
    }
  }

  function handleRemove(member) {
    if (!window.confirm("把「" + member.nickname + "」從成員名單移除？（不會真的擋掉他用連結進來，只是清掉名單）")) return;
    db.doc("trips/" + tripId + "/members/" + member.id).delete();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={function (e) { e.stopPropagation(); }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <PeopleIcon className="w-5 h-5 text-brand-600" /> 行程成員 ({members.length})
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {isCreator && usingRealFirebase && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-2">
            <p className="text-sm font-medium text-slate-700">誰可以編輯？</p>
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="accessMode"
                className="mt-1"
                checked={accessMode !== "google"}
                disabled={savingMode}
                onChange={function () { handleChangeMode("link"); }}
              />
              <span>有連結的人都能編輯<span className="block text-xs text-slate-400">不用登入，輸入暱稱就能加入</span></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="accessMode"
                className="mt-1"
                checked={accessMode === "google"}
                disabled={savingMode}
                onChange={function () { handleChangeMode("google"); }}
              />
              <span>只有 Google 登入的人能編輯<span className="block text-xs text-slate-400">沒登入的人只能看，登入後才能修改</span></span>
            </label>
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-sm text-slate-400">還沒有人設定暱稱加入。</p>
        ) : (
          <div className="space-y-2">
            {members.map(function (m) {
              const isThisMemberCreator = Boolean(creatorDeviceId) && m.deviceId === creatorDeviceId;              return (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 px-3 py-2">
                  <span className="text-sm text-slate-700 truncate">
                    {m.nickname}
                    {isThisMemberCreator && <span className="text-xs text-brand-600 ml-1.5">👑 建立者</span>}
                    {m.isGoogle && <span className="text-xs text-slate-400 ml-1.5">Google</span>}
                  </span>
                  {isCreator && !isThisMemberCreator && (
                    <button onClick={function () { handleRemove(m); }} className="text-xs text-red-500 hover:underline shrink-0">
                      移除
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isCreator && (
          <p className="text-xs text-slate-400 mt-3">只有建立這趟行程的人可以管理名單。</p>
        )}
      </div>
    </div>
  );
}
