// O3：「下載這趟行程供離線使用」。靠兩件事做到，不需要額外的後端或 Service Worker：
// 1) 主動把這趟行程所有子集合「翻過一次」(.get())，讓 O2 開的 Firestore 離線快取確實存到本機
//    （平常只有打開過的分頁，資料才會被快取進去——使用者可能還沒點開花費/行李分頁，
//    這裡一次把全部分頁的資料都翻過，離線時才每個分頁都打得開）
// 2) 主動把購物清單縮圖抓一次：瀏覽器本身的 HTTP 快取就會記住這些圖片，離線時 <img> 還是讀得到
//
// 完成後記錄在這台裝置的 localStorage——這是裝置本機的下載狀態，不用同步到 Firestore，
// 文件裡的 O3 筆記也提到這欄「也可只存本機」。

const OFFLINE_SUBCOLLECTIONS = ["wishlistItems", "itineraryItems", "shoppingItems", "packingItems", "expenses", "members", "prepTasks"];

function offlineStatusKey(tripId) { return "zoula_offline_" + tripId; }

function getOfflineSnapshotInfo(tripId) {
  try {
    const raw = localStorage.getItem(offlineStatusKey(tripId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setOfflineSnapshotInfo(tripId, info) {
  try { localStorage.setItem(offlineStatusKey(tripId), JSON.stringify(info)); } catch (e) {}
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function fetchAndSizeof(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return blob.size;
  } catch (e) {
    return 0;
  }
}

async function downloadTripForOffline(tripId, trip, onProgress) {
  function report(step) { if (onProgress) onProgress(step); }

  if (!usingRealFirebase) {
    // 本機試玩模式本來就全部存在這台瀏覽器，沒有「下載」這回事可做，直接標記完成
    const info = { at: Date.now(), bytes: 0, localMode: true };
    setOfflineSnapshotInfo(tripId, info);
    return info;
  }

  let bytes = 0;

  for (let i = 0; i < OFFLINE_SUBCOLLECTIONS.length; i++) {
    const name = OFFLINE_SUBCOLLECTIONS[i];
    report("讀取" + name + "...");
    try { await db.collection("trips/" + tripId + "/" + name).get(); } catch (e) { console.warn("下載 " + name + " 失敗:", e); }
  }

  const user = firebase.auth().currentUser;
  if (user && !user.isAnonymous) {
    report("讀取個人項目...");
    try { await db.collection("users/" + user.uid + "/trips/" + tripId + "/privateShopping").get(); } catch (e) {}
    try { await db.collection("users/" + user.uid + "/trips/" + tripId + "/privatePacking").get(); } catch (e) {}
  }

  report("查詢天氣...");
  try {
    const itinerarySnap = await db.collection("trips/" + tripId + "/itineraryItems").get();
    const wishlistSnap = await db.collection("trips/" + tripId + "/wishlistItems").get();
    const itineraryItems = itinerarySnap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    const wishlistById = {};
    wishlistSnap.docs.forEach(function (d) { wishlistById[d.id] = d.data(); });
    const dayList = getTripDayList(trip, itineraryItems);
    for (let i = 0; i < dayList.length; i++) {
      const loc = getFirstLocationForDay(dayList[i], itineraryItems, wishlistById);
      if (loc.lat != null && loc.lng != null) {
        await getWeatherForDay(tripId, dayList[i], loc.lat, loc.lng).catch(function () {});
      }
    }
  } catch (e) {
    console.warn("下載天氣快照失敗:", e);
  }

  report("下載圖片...");
  try {
    const shoppingSnap = await db.collection("trips/" + tripId + "/shoppingItems").get();
    const urls = [];
    shoppingSnap.docs.forEach(function (d) {
      const data = d.data();
      if (data.imageUrl && data.imageUrl.indexOf("data:") !== 0) {
        urls.push(cloudinaryThumbUrl(data.imageUrl, 480));
      }
    });
    for (let i = 0; i < urls.length; i++) {
      bytes += await fetchAndSizeof(urls[i]);
    }
  } catch (e) {
    console.warn("下載購物清單圖片失敗:", e);
  }

  const info = { at: Date.now(), bytes: bytes };
  setOfflineSnapshotInfo(tripId, info);
  return info;
}
