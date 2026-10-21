// 「準備」分頁（行前任務雷達 R1~R4）：把需要提前搶票/準備的事，用時間軸排出來，
// 加「加入行事曆」讓手機自己提醒——不需要我們自己發推播，零後端、零額外費用。
const PREP_GROUP_ORDER = [
  { key: "missed", label: "已錯過", Icon: AlertIcon, dotClass: "bg-red-400", hint: "建議直接查看官網還有沒有釋出名額或候補" },
  { key: "today", label: "今天要做", dotClass: "bg-red-500" },
  { key: "week", label: "這 7 天內", dotClass: "bg-amber-400" },
  { key: "later", label: "之後", dotClass: "bg-slate-300" },
  { key: "done", label: "已完成", Icon: CheckCircleIcon, collapsible: true },
];

function groupPrepTasks(tasks) {
  const today = todayStr();
  const groups = { missed: [], today: [], week: [], later: [], done: [] };
  tasks.forEach(function (t) {
    if (t.deletedAt) return;
    if (t.status === "done") { groups.done.push(t); return; }
    const diff = diffDaysInt(today, t.deadlineAt);
    if (diff < 0) groups.missed.push(t);
    else if (diff === 0) groups.today.push(t);
    else if (diff <= 7) groups.week.push(t);
    else groups.later.push(t);
  });
  Object.keys(groups).forEach(function (k) {
    groups[k].sort(function (a, b) { return a.deadlineAt < b.deadlineAt ? -1 : a.deadlineAt > b.deadlineAt ? 1 : 0; });
  });
  return groups;
}

function PrepTaskCard({ tripId, task, onToggleDone, nickname, memberNames }) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [showExpenseForm, setShowExpenseForm] = React.useState(false);
  const opensLabel = task.opensAt && task.openTime && task.timezone
    ? formatAsTaiwanTime(zonedTimeToUtc(task.opensAt, task.openTime, task.timezone)) + "（台灣時間）"
    : null;
  const assignees = task.assignees || [];
  const amClaimed = Boolean(nickname) && assignees.indexOf(nickname) >= 0;

  function updateTask(patch) {
    db.collection("trips/" + tripId + "/prepTasks").doc(task.id).update(patch).catch(function (err) { console.error(err); });
  }

  // R6：任務指派與認領。秒殺型任務允許多人同時認領（提示大家一起搶，誰搶到誰回報），
  // 其他類型的任務認領後就不再顯示「我來」，避免兩個人都以為自己在處理同一件事。
  function toggleClaim() {
    if (!nickname) { window.alert("先在這趟行程設定暱稱才能認領任務"); return; }
    const next = amClaimed ? assignees.filter(function (n) { return n !== nickname; }) : assignees.concat([nickname]);
    updateTask({ assignees: next });
  }

  // R7：完成時可以附上確認截圖，直接重用購物清單/保管箱的上傳方式（壓縮 + 既有的 storage）
  async function handleUploadProof(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const photo = await compressImage(file);
      const safeName = (photo.name || "proof.jpg").replace(/[^\w.\-]/g, "_");
      const path = "trips/" + tripId + "/prepProof/" + generateId(12) + "-" + safeName;
      const ref = storage.ref(path);
      await ref.put(photo);
      const imageUrl = await ref.getDownloadURL();
      updateTask({
        status: "done",
        result: { imageUrl: imageUrl, confirmedBy: nickname || "匿名" },
      });
    } catch (err) {
      console.error(err);
      window.alert("上傳失敗，請稍後再試。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={"rounded-xl border p-3 space-y-2 " + (task.status === "done" ? "border-slate-100 bg-slate-50 opacity-70" : "border-amber-100 bg-white")}>
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={function () { onToggleDone(task); }}
          aria-label={task.status === "done" ? "標記未完成" : "標記完成"}
          className={
            "shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center text-xs " +
            (task.status === "done" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-300 text-transparent")
          }
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5,12.5 L9.5,17 L19,6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className={"text-sm font-medium text-slate-800 " + (task.status === "done" ? "line-through text-slate-400" : "")}>
            {task.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            截止：{task.deadlineAt}
            {opensLabel ? "　開放：" + opensLabel : ""}
          </p>
          {task.notes && <p className="text-xs text-slate-500 mt-1">{task.notes}</p>}
          {task.difficulty === "秒殺" && task.status !== "done" && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><LightningIcon className="w-3.5 h-3.5 shrink-0" /> 搶手任務，建議 2~3 人同時搶，誰搶到誰回報</p>
          )}
          {assignees.length > 0 && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><PeopleIcon className="w-3.5 h-3.5 shrink-0" /> 認領：{assignees.join("、")}</p>
          )}
          {task.status === "done" && task.result && task.result.confirmedBy && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5 shrink-0" /> {task.result.confirmedBy} 回報完成了！</p>
          )}
          {task.result && task.result.imageUrl && (
            <img src={cloudinaryThumbUrl(task.result.imageUrl, 160)} alt="確認截圖" className="w-16 h-16 rounded-lg object-cover mt-1.5" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-8">
        {task.bookingUrl && (
          <a
            href={task.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[32px] px-3 rounded-lg bg-brand-600 text-white text-xs font-medium inline-flex items-center"
          >
            去預約
          </a>
        )}
        {task.status !== "done" && (
          <button type="button" onClick={toggleClaim} className="min-h-[32px] px-3 rounded-lg border border-amber-200 text-slate-600 text-xs font-medium inline-flex items-center gap-1">
            {amClaimed ? "取消認領" : <React.Fragment><HandRaisedIcon className="w-3.5 h-3.5" /> 我來</React.Fragment>}
          </button>
        )}
        {task.status !== "done" && (
          <label className="min-h-[32px] px-3 rounded-lg border border-amber-200 text-slate-600 text-xs font-medium inline-flex items-center gap-1 cursor-pointer">
            {uploading ? "上傳中..." : <React.Fragment><CameraIcon className="w-3.5 h-3.5" /> 回報完成（附截圖）</React.Fragment>}
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadProof} disabled={uploading} />
          </label>
        )}
        <button
          type="button"
          onClick={function () { setShowExpenseForm(true); }}
          className="min-h-[32px] px-3 rounded-lg border border-amber-200 text-slate-600 text-xs font-medium inline-flex items-center gap-1"
        >
          <CoinIcon className="w-3.5 h-3.5" /> 記花費
        </button>
        <button
          type="button"
          onClick={function () { setCalendarOpen(!calendarOpen); }}
          className="min-h-[32px] px-3 rounded-lg border border-amber-200 text-slate-600 text-xs font-medium inline-flex items-center gap-1"
        >
          <CalendarIcon className="w-3.5 h-3.5" /> 加入行事曆
        </button>
      </div>

      {showExpenseForm && (
        <ExpenseForm
          tripId={tripId}
          nickname={nickname}
          memberNames={memberNames}
          defaults={{ note: task.title, date: todayStr() }}
          onClose={function () { setShowExpenseForm(false); }}
        />
      )}

      {calendarOpen && (
        <div className="pl-8 flex flex-wrap gap-2">
          <a
            href={buildGoogleCalendarUrl(task)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-700 underline"
          >
            加到 Google 日曆
          </a>
          <button
            type="button"
            onClick={function () { downloadIcsFile(task.title, [task]); }}
            className="text-xs text-brand-700 underline"
          >
            下載 .ics（iPhone 行事曆）
          </button>
        </div>
      )}
    </div>
  );
}

function PrepPage({ tripId, trip, nickname }) {
  const { data: prepTasks, loading: tasksLoading } = useCollection("trips/" + tripId + "/prepTasks");
  const { data: wishlistItems, loading: wishlistLoading } = useCollection("trips/" + tripId + "/wishlistItems");
  const { data: itineraryItems, loading: itineraryLoading } = useCollection("trips/" + tripId + "/itineraryItems");
  const { data: members } = useCollection("trips/" + tripId + "/members");
  const memberNames = members.map(function (m) { return m.nickname; }).filter(Boolean);
  const generatedRef = React.useRef(false);
  const [doneCollapsed, setDoneCollapsed] = React.useState(true);

  React.useEffect(function () {
    if (generatedRef.current) return;
    if (tasksLoading || wishlistLoading || itineraryLoading) return;
    if (!trip || !trip.startDate) return;

    const itineraryByWishlistId = {};
    itineraryItems.filter(function (i) { return !i.deletedAt; }).forEach(function (i) {
      if (!itineraryByWishlistId[i.wishlistItemId]) itineraryByWishlistId[i.wishlistItemId] = [];
      itineraryByWishlistId[i.wishlistItemId].push(i.date);
    });
    Object.keys(itineraryByWishlistId).forEach(function (id) { itineraryByWishlistId[id].sort(); });

    const existingGenKeys = {};
    const existingWishlistLinks = {};
    prepTasks.forEach(function (t) {
      if (t.source === "template" && t.genKey) existingGenKeys[t.genKey] = true;
      if (t.source === "rule" && t.linkedWishlistItemId) existingWishlistLinks[t.linkedWishlistItemId] = true;
    });

    const toAdd = [];
    buildGenericPrepTasks(trip).forEach(function (t) {
      if (!existingGenKeys[t.genKey]) toAdd.push(t);
    });
    buildRuleMatchedPrepTasks(trip, wishlistItems, itineraryByWishlistId).forEach(function (t) {
      if (!existingWishlistLinks[t.linkedWishlistItemId]) toAdd.push(t);
    });

    if (toAdd.length === 0) { generatedRef.current = true; return; }
    generatedRef.current = true;
    const batch = db.batch();
    toAdd.forEach(function (t) {
      const ref = db.collection("trips/" + tripId + "/prepTasks").doc(generateId(16));
      batch.set(ref, Object.assign({}, t, {
        createdBy: nickname || "系統",
        createdAt: firebase.firestore.Timestamp.now(),
      }));
    });
    batch.commit().catch(function (err) { console.error("建立行前任務失敗:", err); generatedRef.current = false; });
  }, [tasksLoading, wishlistLoading, itineraryLoading, trip && trip.startDate]);

  function toggleDone(task) {
    db.collection("trips/" + tripId + "/prepTasks").doc(task.id).update({
      status: task.status === "done" ? "todo" : "done",
    }).catch(function (err) { console.error(err); });
  }

  if (!trip || !trip.startDate) {
    return (
      <div className="text-center text-slate-400 text-sm py-10">
        這趟行程還沒設定出發日期，先到行程設定補上日期，才能算出行前任務的倒數時間。
      </div>
    );
  }

  if (tasksLoading) return <p className="text-slate-400 text-sm">載入中...</p>;

  const activeTasks = prepTasks.filter(function (t) { return !t.deletedAt; });
  const groups = groupPrepTasks(activeTasks);

  const allForCalendar = activeTasks.filter(function (t) { return t.status !== "done"; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
          <CompassIcon className="w-5 h-5 text-brand-600" /> 準備
        </h2>
        {allForCalendar.length > 0 && (
          <button
            type="button"
            onClick={function () { downloadIcsFile(trip.name + "-行前任務", allForCalendar); }}
            className="min-h-[36px] px-3 rounded-lg border border-amber-200 text-xs text-brand-700 font-medium"
          >
            全部任務一次加入行事曆
          </button>
        )}
      </div>

      {activeTasks.length === 0 && (
        <p className="text-slate-400 text-sm">目前沒有行前任務。把想去的地方加進願望清單，雷達會自動幫你比對需不需要提前預約。</p>
      )}

      {PREP_GROUP_ORDER.map(function (g) {
        const list = groups[g.key];
        if (list.length === 0) return null;
        const collapsed = g.key === "done" && doneCollapsed;
        return (
          <div key={g.key}>
            <button
              type="button"
              onClick={function () { if (g.collapsible) setDoneCollapsed(!doneCollapsed); }}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-700 mb-2"
            >
              <span className="inline-flex items-center gap-1.5">
                {g.Icon ? <g.Icon className="w-4 h-4" /> : <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + g.dotClass} />}
                {g.label}（{list.length}）
              </span>
              {g.collapsible && <span className="text-xs text-slate-400">{collapsed ? "展開" : "收合"}</span>}
            </button>
            {g.hint && !collapsed && <p className="text-xs text-slate-400 mb-2">{g.hint}</p>}
            {!collapsed && (
              <div className="space-y-2">
                {list.map(function (t) {
                  return <PrepTaskCard key={t.id} tripId={tripId} task={t} onToggleDone={toggleDone} nickname={nickname} memberNames={memberNames} />;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
