// "HH:mm" 字串的簡單時間運算，不需要日期函式庫
function timeToMinutes(hhmm) {
  const parts = hhmm.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function minutesToTime(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0");
}

function addMinutesToTime(hhmm, minutesToAdd) {
  return minutesToTime(timeToMinutes(hhmm) + minutesToAdd);
}

// createdAt 可能是 Firestore Timestamp（有 .toMillis()）或純數字毫秒（本機限定的私人資料），統一轉成毫秒方便排序
function toMillis(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  return value || 0;
}
