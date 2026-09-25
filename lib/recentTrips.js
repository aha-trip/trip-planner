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

// 用 Google 登入的人，「打開過的行程」另外存一份在雲端 users/{uid}/trips，換電腦/手機登入同一個帳號也看得到。
function saveRecentTripToCloud(uid, tripId, fields) {
  if (!uid) return Promise.resolve();
  return db.doc("users/" + uid + "/trips/" + tripId).set({
    name: fields.name || "",
    destination: fields.destination || "",
    lastVisited: firebase.firestore.Timestamp.now(),
  }).catch(function (e) { console.warn("同步行程清單到雲端失敗:", e); });
}

function removeRecentTripFromCloud(uid, tripId) {
  if (!uid) return Promise.resolve();
  return db.doc("users/" + uid + "/trips/" + tripId).delete().catch(function (e) { console.warn(e); });
}

// 本機記錄 + 雲端記錄合併（同一趟行程以最新一次打開的資料為準），依最近打開時間排序
function mergeRecentTrips(localTrips, cloudTrips) {
  const map = {};
  (localTrips || []).forEach(function (t) {
    map[t.tripId] = { tripId: t.tripId, name: t.name, destination: t.destination || "", lastVisited: t.lastVisited || 0 };
  });
  (cloudTrips || []).forEach(function (c) {
    const lv = toMillis(c.lastVisited);
    const existing = map[c.id];
    if (!existing || lv > existing.lastVisited) {
      map[c.id] = { tripId: c.id, name: c.name, destination: c.destination || "", lastVisited: lv };
    }
  });
  return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.lastVisited - a.lastVisited; });
}
