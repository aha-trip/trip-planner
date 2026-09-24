// 記錄這個瀏覽器建立過/打開過的行程，讓首頁可以列出來（純本機記錄，換瀏覽器/裝置看不到彼此的清單）
const RECENT_TRIPS_KEY = "travel-app-recent-trips";
const RECENT_TRIPS_MAX = 20;

function getRecentTrips() {
  try {
    const raw = localStorage.getItem(RECENT_TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function recordRecentTrip(tripId, fields) {
  try {
    const list = getRecentTrips().filter(function (t) { return t.tripId !== tripId; });
    list.unshift(Object.assign({ tripId: tripId, lastVisited: Date.now() }, fields));
    localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(list.slice(0, RECENT_TRIPS_MAX)));
  } catch (e) {
    console.warn("記錄最近行程失敗:", e);
  }
}

function removeRecentTrip(tripId) {
  try {
    const list = getRecentTrips().filter(function (t) { return t.tripId !== tripId; });
    localStorage.setItem(RECENT_TRIPS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("移除最近行程失敗:", e);
  }
}
