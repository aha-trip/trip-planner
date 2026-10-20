// 「行前任務雷達」的預約規則資料庫（第一版：先放在程式碼裡維護，規則不多、改動時直接編輯這個檔案、
// 重新部署就生效。等規則多到需要讓使用者協作回報（文件裡的 R11）時，再搬進 Firestore + 做審核後台）。
//
// ⚠️ 誠實聲明：這些開放時間/方式是人工整理的參考資訊，景點隨時可能改規則、改售票平台。
// 每筆都有 verified 欄位，目前全部先設 false——畫面上會提醒使用者自己到官網核對一次，
// 不要讓使用者完全依賴這份資料去搶票。確認過之後把對應項目的 verified 改成 true 即可。
//
// aliases：拿來跟願望清單地點名稱比對用的關鍵字（比對時忽略大小寫、只要「名稱裡包含其中一個關鍵字」就算命中）。
//
// ruleType 目前支援兩種：
//   "fixed-monthly"：固定在每月某一天開放下個月份的場次（openDayOfMonth + openTime + timezone）
//   "rolling"：沒有固定開放日，建議盡早訂（只顯示 openRuleText 這段文字提醒，不會算倒數時間）
const BOOKING_RULES = [
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

// 把某個地點名稱拿去跟規則庫比對，回傳命中的規則（沒命中回傳 null）
function matchBookingRule(placeName) {
  if (!placeName) return null;
  const lower = placeName.toLowerCase();
  for (let i = 0; i < BOOKING_RULES.length; i++) {
    const rule = BOOKING_RULES[i];
    const hit = rule.aliases.some(function (alias) {
      return lower.indexOf(alias.toLowerCase()) >= 0;
    });
    if (hit) return rule;
  }
  return null;
}
