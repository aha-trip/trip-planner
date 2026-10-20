// 「行前任務雷達」的預約規則資料庫。真正的資料現在存在 Firestore 的 bookingRules collection，
// 可以到 #/admin/booking-rules 後台維護（只有 config.js 設定的 adminEmail 那個 Google 帳號能進去）。
// 這份清單是「預設種子資料」：後台第一次使用時可以一鍵匯入這幾筆，Firestore 連不上/還沒同步完成時
// 也拿這份頂著用，確保雷達永遠有規則可以比對，不會因為 Firestore 一時連不上就整個失效。
//
// ⚠️ 誠實聲明：這些開放時間/方式是人工整理的參考資訊，景點隨時可能改規則、改售票平台。
// 每筆都有 verified 欄位，目前全部先設 false——畫面上會提醒使用者自己到官網核對一次，
// 不要讓使用者完全依賴這份資料去搶票。確認過之後到後台把對應項目的 verified 改成 true 即可。
//
// aliases：拿來跟願望清單地點名稱比對用的關鍵字（比對時忽略大小寫、只要「名稱裡包含其中一個關鍵字」就算命中）。
//
// ruleType 目前支援兩種：
//   "fixed-monthly"：固定在每月某一天開放下個月份的場次（openDayOfMonth + openTime + timezone）
//   "rolling"：沒有固定開放日，建議盡早訂（只顯示 openRuleText 這段文字提醒，不會算倒數時間）
const DEFAULT_BOOKING_RULES = [
  {
    id: "ghibli-museum",
    aliases: ["吉卜力美術館", "三鷹の森ジブリ美術館", "三鷹之森吉卜力美術館", "ghibli museum"],
    city: "東京",
    ruleType: "fixed-monthly",
    openDayOfMonth: 10,
    openTime: "10:00",
    timezone: "Asia/Tokyo",
    openRuleText: "每月 10 日 10:00（日本時間）開放下個月份的場次，熱門月份經常當天就賣完",
    difficulty: "秒殺",
    bookingUrl: "https://www.ghibli-museum.jp/",
    tips: "建議開賣前先確認官網目前的售票方式（曾經透過 Lawson Ticket／指定旅行社代售），海外遊客購票管道可能跟日本本地不同。",
    sourceUrl: "https://www.ghibli-museum.jp/",
    verified: false,
  },
  {
    id: "teamlab-planets",
    aliases: ["teamlab planets", "teamlab", "チームラボ"],
    city: "東京",
    ruleType: "rolling",
    openRuleText: "沒有固定開放日，採時段預約制，建議至少提前 2~4 週上官網購票，熱門時段（傍晚、假日）容易提早售完",
    difficulty: "當天滿",
    bookingUrl: "https://planets.teamlab.art/",
    tips: "選平日上午場通常比較好訂，進場時段要準時，遲到可能無法入場。",
    sourceUrl: "https://planets.teamlab.art/",
    verified: false,
  },
  {
    id: "tokyo-disney",
    aliases: ["東京迪士尼", "迪士尼樂園", "迪士尼海洋", "tokyo disneyland", "disneysea", "tokyo disney"],
    city: "東京",
    ruleType: "rolling",
    openRuleText: "採日期制門票、官方通常開放約 2 個月內的場次，熱門日期（假日、櫻花季）常常提前賣完",
    difficulty: "當天滿",
    bookingUrl: "https://www.tokyodisneyresort.jp/",
    tips: "確定出發日期後就建議先上官網查當天票券狀況，不要等到快出發才訂。",
    sourceUrl: "https://www.tokyodisneyresort.jp/",
    verified: false,
  },
  {
    id: "usj",
    aliases: ["環球影城", "universal studios japan", "usj"],
    city: "大阪",
    ruleType: "rolling",
    openRuleText: "入場券＋快速通關（Express Pass）建議提前上官網購買，熱門假期快速通關常提前售完",
    difficulty: "當天滿",
    bookingUrl: "https://www.usj.co.jp/",
    tips: "快速通關依設施/等級分很多種版本，確認好想玩的設施再選對應方案。",
    sourceUrl: "https://www.usj.co.jp/",
    verified: false,
  },
];

// 把某個地點名稱拿去跟規則庫比對，回傳命中的規則（沒命中回傳 null）。
// 規則來源看 lib/bookingRulesStore.js 的 getActiveBookingRules()——優先用 Firestore 後台維護的
// 內容，還沒同步完成或連不上時退回上面這份預設清單。
function matchBookingRule(placeName) {
  if (!placeName) return null;
  const lower = placeName.toLowerCase();
  const rules = getActiveBookingRules();
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const hit = (rule.aliases || []).some(function (alias) {
      return lower.indexOf(alias.toLowerCase()) >= 0;
    });
    if (hit) return rule;
  }
  return null;
}
