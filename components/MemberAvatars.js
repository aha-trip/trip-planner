// 一排小小的成員頭像（用暱稱第一個字當頭像，這個 App 沒有存大頭貼）。
// 首頁的行程列表、邀請畫面都共用這個，讀取失敗或還沒人加入就安靜不顯示。
function MemberAvatars({ tripId, limit, size }) {
  limit = limit || 4;
  size = size || "w-5 h-5 text-[9px]";

  const { data: members } = useCollection(
    "trips/" + tripId + "/members",
    function (ref) { return ref.orderBy("lastSeenAt", "desc").limit(limit); }
  );

  if (!members || members.length === 0) return null;

  const shown = members.slice(0, limit - 1 > 0 ? limit - 1 : limit);
  const extra = members.length - shown.length;

  return (
    <div className="flex items-center -space-x-1.5 shrink-0">
      {shown.map(function (m) {
        return (
          <span
            key={m.id}
            title={m.nickname}
            className={"shrink-0 rounded-full bg-brand-100 border border-white font-bold text-brand-700 flex items-center justify-center " + size}
          >
            {(m.nickname || "?").charAt(0).toUpperCase()}
          </span>
        );
      })}
      {extra > 0 && (
        <span className={"shrink-0 rounded-full bg-slate-100 border border-white font-bold text-slate-500 flex items-center justify-center " + size}>
          +{extra}
        </span>
      )}
    </div>
  );
}
