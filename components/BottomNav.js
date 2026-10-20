// 手機版的底部導覽列（拇指熱區）：把最常用的 4 個分頁放在畫面下方 1/3，單手就點得到，
// 取代原本在頂端、要伸手去點的分頁列。只在小螢幕顯示（sm 以上還是用原本頂端那排分頁），
// 網頁版滑鼠操作、螢幕夠寬，底部固定列反而佔空間又用不到。
//
// 分頁放不進 4 個拇指熱區位置，所以留 4 個最常用的在底部、其餘收進「更多」彈出選單，
// 跟頂端那排分頁（網頁版看得到全部）並存，兩種入口都看得到同一份分頁清單。
// 「更多」選單裡最下面（離底部導覽列最近、最好點）固定放行李清單、購物清單——其餘動作類項目
// （行程成員/編輯/帳號/分享/清除快取/WiFi）排在上面。
const BOTTOM_NAV_PRIMARY = [
  { key: "wishlist", label: "願望", Icon: HeartListIcon },
  { key: "itinerary", label: "行程", Icon: CalendarIcon },
  { key: "map", label: "地圖", Icon: PinIcon },
  { key: "expenses", label: "花費", Icon: ReceiptIcon },
];

const BOTTOM_NAV_OVERFLOW = [
  { key: "prep", label: "準備", Icon: CompassIcon },
  { key: "shopping", label: "購物清單", Icon: ReceiptIcon },
  { key: "packing", label: "行李清單", Icon: BagIcon },
];

function BottomNav({ tripId, activeTab, onOpenMembers, onShare, onEditTrip, copied, wifiLink }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const wrapRef = React.useRef(null);

  // 切到其他分頁後，下次打開這個元件時「更多」選單不該還留著上次的開啟狀態
  React.useEffect(function () { setMoreOpen(false); }, [activeTab]);

  React.useEffect(function () {
    if (!moreOpen) return;
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside);
    return function () {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [moreOpen]);

  const isOverflowActive = BOTTOM_NAV_OVERFLOW.some(function (t) { return t.key === activeTab; });

  const itemClass = function (active) {
    return (
      "flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium " +
      (active ? "text-brand-600" : "text-slate-400")
    );
  };

  return (
    <nav
      ref={wrapRef}
      className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-amber-100 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {moreOpen && (
        <div className="absolute bottom-full right-3 mb-1 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden divide-y divide-amber-100">
          {/* 行程成員/編輯/帳號/分享/清除快取這幾個比較少用的動作，收進「設定」面板，
              不要全部攤開佔掉這個選單一大半 */}
          <button
            type="button"
            className="w-full min-h-[44px] flex items-center gap-3 px-4 text-left text-sm text-slate-700 active:bg-amber-50"
            onClick={function () { setMoreOpen(false); setShowSettings(true); }}
          >
            <GearIcon className="w-4 h-4 text-brand-600" /> 設定
          </button>

          {wifiLink && (
            <a
              href={wifiLink.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={function () { setMoreOpen(false); }}
              className="w-full min-h-[44px] flex items-center gap-3 px-4 text-sm text-slate-700 active:bg-amber-50"
            >
              <GlobeIcon className="w-4 h-4 text-brand-600" /> {wifiLink.label}
            </a>
          )}

          {/* 其他行程分頁放最下面，離底部導覽列最近、最好點 */}
          {BOTTOM_NAV_OVERFLOW.map(function (tab) {
            const isActive = tab.key === activeTab;
            return (
              <a
                key={tab.key}
                href={"#/trip/" + tripId + "/" + tab.key}
                onClick={function () { setMoreOpen(false); }}
                className={
                  "w-full min-h-[44px] flex items-center gap-3 px-4 text-sm " +
                  (isActive ? "text-brand-700 bg-brand-50" : "text-slate-700 active:bg-amber-50")
                }
              >
                <tab.Icon className="w-4 h-4" /> {tab.label}
              </a>
            );
          })}
        </div>
      )}

      {BOTTOM_NAV_PRIMARY.map(function (tab) {
        const isActive = tab.key === activeTab;
        return (
          <a
            key={tab.key}
            href={"#/trip/" + tripId + "/" + tab.key}
            onClick={function () { if (!isActive) hapticLight(); }}
            className={itemClass(isActive)}
          >
            <tab.Icon className="w-5 h-5" />
            {tab.label}
          </a>
        );
      })}

      <button
        type="button"
        onClick={function () { hapticLight(); setMoreOpen(!moreOpen); }}
        aria-label="更多分頁"
        aria-expanded={moreOpen}
        className={itemClass(isOverflowActive || moreOpen)}
      >
        <MoreIcon className="w-5 h-5" />
        更多
      </button>

      {showSettings && (
        <SettingsPanel
          onOpenMembers={onOpenMembers}
          onEditTrip={onEditTrip}
          onShare={onShare}
          copied={copied}
          onClose={function () { setShowSettings(false); }}
        />
      )}
    </nav>
  );
}
