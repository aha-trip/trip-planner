// 算出這趟行程要顯示哪些天：以 trip.startDate~endDate 為主，
// 但如果已經有行程項目排在範圍外的日期，也要一併顯示（避免資料看不到）。
function addDays(dateStr, n) {
  // 全程用 UTC 運算，避免在 UTC+8 這種時區下，local time <-> toISOString() 換算把 +1 天抵銷掉
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
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
