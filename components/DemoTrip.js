// 「看範例行程」唯讀示範頁：純靜態假資料，完全不連 Firestore，不管本機試玩模式或正式
// Firebase 都長一樣、不會真的寫入任何資料庫，給第一次來的人快速看一眼大概長什麼樣子。
const DEMO_WISHLIST = [
  { category: "sight", name: "大阪城", address: "大阪府大阪市中央區大阪城1-1", notes: "天守閣可以登頂看整個大阪市景" },
  { category: "food", name: "黑門市場", address: "大阪府大阪市中央區日本橋1丁目", notes: "邊走邊吃，河豚、生魚片都有" },
  { category: "sight", name: "道頓堀", address: "大阪府大阪市中央區道頓堀", notes: "晚上的固力果看板一定要拍" },
  { category: "food", name: "蟹道樂 本店", address: "大阪府大阪市中央區道頓堀1丁目", notes: "記得先在網路上訂位" },
  { category: "shopping", name: "心齋橋筋商店街", address: "大阪府大阪市中央區心齋橋筋", notes: "藥妝、服飾都在這條街" },
];

const DEMO_ITINERARY = [
  {
    day: "Day 1 · 11/12（四）",
    items: [
      { time: "09:30", name: "大阪城", note: "預留 2 小時" },
      { time: "12:00", name: "黑門市場", note: "午餐" },
      { time: "15:00", name: "心齋橋筋商店街", note: "逛街、買藥妝" },
    ],
  },
  {
    day: "Day 2 · 11/13（五）",
    items: [
      { time: "10:00", name: "道頓堀", note: "散步、拍照" },
      { time: "12:30", name: "蟹道樂 本店", note: "已訂位 12:30" },
    ],
  },
];

const DEMO_MEMBERS = ["家", "明", "華"];

function DemoSectionTitle({ Icon, children }) {
  return (
    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
      <Icon className="w-5 h-5 text-brand-600" /> {children}
    </h2>
  );
}

function DemoTrip() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sky-100 via-cream to-cream" />

      <header className="bg-cream/60 backdrop-blur border-b-2 border-brand-200/70 sticky top-0 z-10">
        <div className="bg-amber-50 text-amber-800 text-xs text-center py-1 px-2">
          📖 這是範例行程，純粹示範用，點什麼都不會真的被儲存
        </div>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <a href="#/" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-brand-50" aria-label="回首頁" title="回首頁">
              <img src="logo-icon.png" alt="" className="w-9 h-9 object-contain" />
            </a>
            <h1 className="text-base font-bold text-slate-800 truncate">大阪五日遊 · 日本大阪</h1>
          </div>
          <a
            href="#/"
            className="shrink-0 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 transition"
          >
            ＋ 建立我的行程
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            {DEMO_MEMBERS.map(function (initial, i) {
              return (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full bg-brand-100 border-2 border-white text-xs font-bold text-brand-700 flex items-center justify-center"
                >
                  {initial}
                </span>
              );
            })}
          </div>
          <span className="text-xs text-slate-500">3 位成員一起規劃這趟行程</span>
        </div>

        <section>
          <DemoSectionTitle Icon={HeartListIcon}>願望清單</DemoSectionTitle>
          <div className="space-y-2">
            {DEMO_WISHLIST.map(function (item, i) {
              return (
                <div key={i} className="bg-white rounded-xl border border-amber-100 px-3 py-2.5 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.address}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <DemoSectionTitle Icon={CalendarIcon}>行程</DemoSectionTitle>
          <div className="space-y-4">
            {DEMO_ITINERARY.map(function (day, i) {
              return (
                <div key={i}>
                  <p className="text-sm font-bold text-brand-700 mb-1.5">{day.day}</p>
                  <div className="space-y-1.5">
                    {day.items.map(function (item, j) {
                      return (
                        <div key={j} className="bg-white rounded-lg border border-amber-100 px-3 py-2 flex items-center gap-3">
                          <span className="shrink-0 text-xs font-mono text-slate-400 w-10">{item.time}</span>
                          <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 truncate">{item.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{item.note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <DemoSectionTitle Icon={BagIcon}>購物清單</DemoSectionTitle>
          <div className="grid grid-cols-3 gap-2 max-w-xs">
            {["#fdead4", "#fad3a8", "#f6b571"].map(function (color, i) {
              return (
                <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-2xl" style={{ background: color }}>
                  🛍️
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">大家拍下想買的東西，截圖丟進來，一起決定要不要買</p>
        </section>

        <div className="text-center pt-4">
          <a
            href="#/"
            className="inline-block rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 transition"
          >
            ＋ 建立屬於你的行程
          </a>
          <p className="text-xs text-slate-400 mt-2">不用註冊，建立好馬上把連結分享給大家</p>
        </div>
      </main>
    </div>
  );
}
