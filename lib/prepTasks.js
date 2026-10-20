// 「行前任務雷達」的任務產生邏輯（R1 規則比對 + R3 通用任務）。
// 只負責「算出應該有哪些任務」，實際寫進 Firestore 由呼叫端（PrepPage）處理，
// 方便之後要加新規則/新任務類型時，這裡改一個地方就好。

// R3：行程一有目的地+出發日，就產生一組通用行前任務。不是每趟行程都有確定日期（本 App
// 支援「日期未定」的行程），沒有 startDate 就不產生——沒有基準日，提醒不出時間點也沒有意義。
function buildGenericPrepTasks(trip) {
  if (!trip || !trip.startDate) return [];
  const tasks = [
    {
      key: "esim",
      title: "購買網路（eSIM／Wi-Fi 機）",
      category: "other",
      daysBefore: 7,
      bookingUrl: "https://ahaha0610.esimart.cc/home",
      notes: "出發前先買好，落地直接有網路可用。",
    },
    {
      key: "insurance",
      title: "投保旅遊平安險／不便險",
      category: "other",
      daysBefore: 3,
      notes: "記得連同班機延誤、行李遺失一起保，出發前確認保單已經生效。",
    },
    {
      key: "customs",
      title: "填寫入境申報資料",
      category: "other",
      daysBefore: 3,
      notes: "不同國家的線上入境申報系統開放時間不同，出發前抓時間填寫（填太早可能還沒開放）。",
    },
    {
      key: "currency",
      title: "換匯／確認海外刷卡額度",
      category: "other",
      daysBefore: 5,
      notes: "確認信用卡有開通海外刷卡、額度夠不夠，現金換一些小額備用。",
    },
  ];
  return tasks.map(function (t) {
    return {
      source: "template",
      genKey: t.key,
      title: t.title,
      category: t.category,
      deadlineAt: addDays(trip.startDate, -t.daysBefore),
      bookingUrl: t.bookingUrl || null,
      notes: t.notes,
      status: "todo",
    };
  });
}

// R1：拿願望清單裡的地點名稱去比對規則庫，算出「開放日」「截止日（=到訪日，沒排進行程就用
// 行程起始日代替）」。回傳的是「應該存在的任務草稿」，呼叫端自己去跟既有 prepTasks 比對、
// 只新增還沒建立過的，避免每次都重複寫入同一筆。
function buildRuleMatchedPrepTasks(trip, wishlistItems, itineraryItemsByWishlistId) {
  if (!trip) return [];
  const drafts = [];
  (wishlistItems || []).forEach(function (item) {
    if (item.deletedAt) return;
    const rule = matchBookingRule(item.name);
    if (!rule) return;

    // 這個地點有沒有已經排進行程的某一天？有的話用那天當「到訪日」，沒有就先用行程起始日。
    const scheduled = itineraryItemsByWishlistId && itineraryItemsByWishlistId[item.id];
    const visitDate = (scheduled && scheduled[0]) || trip.startDate;
    if (!visitDate) return;

    let openDate = null;
    if (rule.ruleType === "fixed-monthly") {
      openDate = computeFixedMonthlyOpenDate(visitDate, rule.openDayOfMonth);
    }

    drafts.push({
      source: "rule",
      ruleId: rule.id,
      linkedWishlistItemId: item.id,
      title: rule.id === "ghibli-museum" || rule.ruleType === "fixed-monthly"
        ? item.name + "：" + rule.openRuleText
        : item.name + "：建議提前預約",
      category: item.category || "sight",
      deadlineAt: visitDate,
      opensAt: openDate,
      openTime: rule.ruleType === "fixed-monthly" ? rule.openTime : null,
      timezone: rule.ruleType === "fixed-monthly" ? rule.timezone : null,
      bookingUrl: rule.bookingUrl,
      notes: rule.tips + (rule.verified ? "" : "（⚠️ 這條規則還沒人工核對過，出發前請自己到官網確認一次）"),
      status: "todo",
    });
  });
  return drafts;
}

// ruleType = "fixed-monthly" 的開放日：到訪月份的「前一個月」openDayOfMonth 號
function computeFixedMonthlyOpenDate(visitDateStr, openDayOfMonth) {
  const parts = visitDateStr.split("-").map(Number);
  let year = parts[0];
  let month = parts[1] - 1; // 0-indexed 的到訪月
  month -= 1; // 往前推一個月
  if (month < 0) { month = 11; year -= 1; }
  return year + "-" + String(month + 1).padStart(2, "0") + "-" + String(openDayOfMonth).padStart(2, "0");
}
