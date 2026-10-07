// 算出這趟行程要顯示哪些天：以 trip.startDate~endDate 為主，
// 但如果已經有行程項目排在範圍外的日期，也要一併顯示（避免資料看不到）。
function addDays(dateStr, n) {
  // 全程用 UTC 運算，避免在 UTC+8 這種時區下，local time <-> toISOString() 換算把 +1 天抵銷掉
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 兩個 YYYY-MM-DD 之間差幾天（b - a），同樣全程用 UTC 運算
function diffDaysInt(aStr, bStr) {
  const a = aStr.split("-").map(Number);
  const b = bStr.split("-").map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  const da = Date.UTC(a[0], a[1] - 1, a[2]);
  const db = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.round((db - da) / msPerDay);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// 給首頁「你打開過的行程」列表用：算出一句話狀態（倒數幾天出發／進行中／已結束／日期未定）
function getTripDateStatus(trip) {
  if (!trip || !trip.startDate) {
    return trip && trip.approxDays ? { kind: "approx", text: "約" + trip.approxDays + "天・日期未定" } : { kind: "none", text: "日期未定" };
  }
  const today = todayStr();
  const end = trip.endDate || trip.startDate;
  if (today < trip.startDate) {
    const days = diffDaysInt(today, trip.startDate);
    return { kind: "upcoming", text: days === 0 ? "今天出發" : days + "天後出發" };
  }
  if (today <= end) {
    return { kind: "ongoing", text: "行程進行中" };
  }
  return { kind: "past", text: "已結束" };
}

function getTripDayList(trip, itineraryItems) {
  const days = new Set();

  if (trip && trip.startDate && trip.endDate) {
    let cursor = trip.startDate;
    let guard = 0;
    while (cursor <= trip.endDate && guard < 60) {
      days.add(cursor);
      cursor = addDays(cursor, 1);
      guard++;
    }
  }

  (itineraryItems || []).forEach(function (item) {
    if (item.date) days.add(item.date);
  });

  const sorted = Array.from(days).sort();
  return sorted;
}

// 找出某一天行程裡「第一個項目」的座標，給天氣用（一天通常在同一個城市，用第一站當代表位置）
function getFirstLocationForDay(date, itineraryItems, wishlistById) {
  const dayItems = (itineraryItems || [])
    .filter(function (i) { return i.date === date; })
    .sort(function (a, b) { return a.order - b.order; });
  if (dayItems.length === 0) return { lat: null, lng: null };
  const wishlistItem = wishlistById[dayItems[0].wishlistItemId];
  return { lat: wishlistItem ? wishlistItem.lat : null, lng: wishlistItem ? wishlistItem.lng : null };
}

const CATEGORY_LABELS = {
  food: "美食",
  sight: "景點",
  activity: "活動",
  shopping: "購物",
  other: "其他",
};

const TRANSPORT_LABELS = {
  walk: "步行",
  drive: "開車",
  taxi: "計程車",
  transit: "大眾運輸",
  bike: "自行車",
};
