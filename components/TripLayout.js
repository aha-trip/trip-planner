const TABS = [
  { key: "wishlist", label: "願望清單" },
  { key: "itinerary", label: "行程" },
  { key: "map", label: "地圖" },
  { key: "expenses", label: "花費" },
  { key: "packing", label: "行李" },
  { key: "shopping", label: "購物清單" },
];

function TripLayout({ tripId, activeTab, focusItemId }) {
  const { data: trip, loading, error: tripError } = useDocument("trips/" + tripId);
  const { nickname: localNickname, setNickname } = useLocalIdentity();
  const auth = useAuth();
  // 用 Google 登入時直接用 Google 名稱（換裝置也一樣）；否則用自己輸入的暱稱
  const nickname = auth.isGoogle ? auth.user.displayName : localNickname;
  const [dismissedGooglePrompt, setDismissedGooglePrompt] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showMembers, setShowMembers] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const headerVisible = useAutoHideHeader();
  const online = useOnlineStatus();
  // 用 callback ref 而不是 useRef+useEffect([])：因為載入中 (loading) 那個分支還沒有 <header>，
  // 如果用空依賴陣列的 useEffect，第一次執行時 ref 可能還是 null，之後就再也不會重新量測了。
  // callback ref 保證「DOM 節點真正掛上去的當下」一定會被呼叫到，不管是不是在第一次算染。
  const [headerEl, setHeaderEl] = React.useState(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);

  React.useEffect(function () {
    if (!headerEl || typeof ResizeObserver === "undefined") return;
    function measure() { setHeaderHeight(headerEl.offsetHeight); }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(headerEl);
    return function () { ro.disconnect(); };
  }, [headerEl]);

  React.useEffect(function () {
    if (!nickname) return;
    // 「只限 Google 登入者編輯」的行程，沒登入時寫入會被規則擋下，這裡就不寫了
    if (trip && trip.accessMode === "google" && !auth.isGoogle) return;
    db.doc("trips/" + tripId + "/members/" + sanitizeMemberId(nickname)).set({
      nickname: nickname,
      deviceId: getDeviceId(),
      isGoogle: auth.isGoogle,
      lastSeenAt: firebase.firestore.Timestamp.now(),
    }).catch(function (err) { console.error("更新成員名單失敗:", err); });
  }, [tripId, nickname, auth.isGoogle, trip && trip.accessMode]);

  React.useEffect(function () {
    if (!trip) return;
    recordRecentTrip(tripId, {
      name: trip.name,
      destination: trip.destination || "",
      startDate: trip.startDate || null,
      endDate: trip.endDate || null,
      approxDays: trip.approxDays || null,
    });
  }, [tripId, trip && trip.name, trip && trip.destination, trip && trip.startDate, trip && trip.endDate, trip && trip.approxDays]);

  // 這趟行程是在「建立者管理名單」功能上線前就建立的，沒有記錄 creatorDeviceId，
  // 這裡讓第一個打開它的人（通常就是原本的建立者回來看）自動補上，避免永遠沒有人能管理名單。
  React.useEffect(function () {
    if (!trip || trip.creatorDeviceId) return;
    db.doc("trips/" + tripId).update({ creatorDeviceId: getDeviceId() });
  }, [tripId, trip && trip.creatorDeviceId]);

  // 建立者的「帳號身分」：Firestore 規則靠它判斷誰能切換編輯權限。
  // 舊行程沒有這欄，由建立者的那台裝置回來打開時補上。
  const uid = auth.user ? auth.user.uid : null;
  React.useEffect(function () {
    if (!trip || !uid || trip.creatorUid || trip.creatorDeviceId !== getDeviceId()) return;
    db.doc("trips/" + tripId).update({ creatorUid: uid }).catch(function (err) { console.error(err); });
  }, [tripId, uid, trip && trip.creatorUid, trip && trip.creatorDeviceId]);

  // 用 Google 登入時，把這趟行程記進帳號的「打開過的行程」，換裝置登入也看得到
  React.useEffect(function () {
    if (!trip || !uid || !auth.isGoogle) return;
    saveRecentTripToCloud(uid, tripId, {
      name: trip.name,
      destination: trip.destination || "",
      startDate: trip.startDate || null,
      endDate: trip.endDate || null,
      approxDays: trip.approxDays || null,
    });
  }, [tripId, uid, auth.isGoogle, trip && trip.name, trip && trip.destination, trip && trip.startDate, trip && trip.endDate, trip && trip.approxDays]);

  function copyShareLink() {
    const url = window.location.origin + window.location.pathname + "#/trip/" + tripId + "/wishlist";
    navigator.clipboard
      .writeText(url)
      .then(function () {
        setCopied(true);
        setTimeout(function () { setCopied(false); }, 2000);
      })
      .catch(function () {
        window.prompt("複製這個連結分享給大家：", url);
      });
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center text-slate-400">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
        載入中...
      </div>
    );
  }

  // 讀取過程出錯（例如網路不穩、登入狀態還沒就緒）跟「這趟行程真的不存在」是兩件不同的事，
  // 不能都顯示成「找不到行程」——那會讓使用者誤以為連結壞了，其實重新整理通常就會好。
  if (tripError) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
        <div className="max-w-md rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 text-center space-y-3">
          <p>讀取行程時連線出了問題，不一定是連結本身有誤。</p>
          <button
            onClick={function () { window.location.reload(); }}
            className="min-h-[40px] px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
        <div className="max-w-md rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-4">
          找不到這趟行程，連結可能有誤。
        </div>
      </div>
    );
  }

  const googleOnly = trip.accessMode === "google";
  const locked = googleOnly && !auth.isGoogle;
  const isCreator = trip.creatorDeviceId === getDeviceId() || (Boolean(uid) && trip.creatorUid === uid);

  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />
      {locked && !dismissedGooglePrompt && (
        <GoogleRequiredPrompt onDismiss={function () { setDismissedGooglePrompt(true); }} />
      )}
      {!locked && !nickname && <NicknamePrompt onSubmit={setNickname} trip={trip} tripId={tripId} />}

      <header
        ref={setHeaderEl}
        className={
          "bg-cream/60 backdrop-blur border-b-2 border-brand-200/70 fixed top-0 left-0 right-0 z-10 transition-transform duration-300 " +
          (headerVisible || menuOpen ? "translate-y-0" : "-translate-y-full")
        }
      >
        {usingLocalBackend && (
          <div className="bg-sky-50 text-sky-800 text-xs text-center py-1 px-2">
            🧪 本機試玩模式：資料只存在這個瀏覽器，還不會跟別人同步
          </div>
        )}
        {!online && (
          <div className="bg-slate-100 text-slate-600 text-xs text-center py-1 px-2">
            📴 目前離線，顯示的是上次同步的資料；你的修改會先存在這台裝置上，恢復網路後自動同步
          </div>
        )}
        {locked && (
          <div className="bg-amber-50 text-amber-800 text-xs text-center py-1 px-2">
            🔒 這趟行程限 Google 登入者編輯，目前是唯讀，你的修改不會儲存
          </div>
        )}
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <HeaderMenu
              open={menuOpen}
              setOpen={setMenuOpen}
              onOpenMembers={function () { setShowMembers(true); }}
              onShare={copyShareLink}
              copied={copied}
            />
            <a
              href="#/"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50"
              aria-label="回首頁"
              title="回首頁"
            >
              <img src="logo-icon.png" alt="" className="w-9 h-9 object-contain" />
            </a>
            <h1 className="text-base font-bold text-slate-800 min-w-0 leading-snug break-words line-clamp-2">
              {trip.name}
              {trip.destination && <span> · {trip.destination}</span>}
              {!trip.startDate && trip.approxDays && <span> · 約{trip.approxDays}天（日期未定）</span>}
            </h1>
          </div>
          <FontSizeButton />
        </div>
        {/* 手機上（< sm）改用畫面下方的 <BottomNav/>，拇指比較好點到；
            網頁版（>= sm）維持原本頂端這排，滑鼠操作、螢幕夠寬，固定在底部反而佔空間。 */}
        <nav className="hidden sm:flex max-w-3xl mx-auto px-4 gap-1 overflow-x-auto">
          {TABS.map(function (tab) {
            const isActive = tab.key === activeTab;
            return (
              <a
                key={tab.key}
                href={"#/trip/" + tripId + "/" + tab.key}
                className={
                  "shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition " +
                  (isActive ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700")
                }
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      </header>
      <div style={{ height: headerHeight }} />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 sm:pb-6">
        {activeTab === "wishlist" && <WishlistPage tripId={tripId} trip={trip} nickname={nickname} />}
        {activeTab === "itinerary" && <ItineraryPage tripId={tripId} trip={trip} nickname={nickname} />}
        {activeTab === "map" && <MapPage tripId={tripId} trip={trip} nickname={nickname} focusItemId={focusItemId} />}
        {activeTab === "expenses" && <ExpensesPage tripId={tripId} nickname={nickname} />}
        {activeTab === "packing" && <PackingListPage tripId={tripId} nickname={nickname} />}
        {activeTab === "shopping" && <ShoppingPage tripId={tripId} nickname={nickname} />}
      </main>

      <BottomNav tripId={tripId} activeTab={activeTab} />

      {showMembers && (
        <MemberListPanel
          tripId={tripId}
          isCreator={isCreator}
          creatorDeviceId={trip.creatorDeviceId}          accessMode={googleOnly ? "google" : "link"}
          onClose={function () { setShowMembers(false); }}
        />
      )}
    </div>
  );
}
