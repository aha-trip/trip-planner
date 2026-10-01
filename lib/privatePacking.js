// 「只有我看得到」的行李清單項目，兩種存放方式：
//  - 有用 Google 登入：存在 Firestore 的 users/{uid}/trips/{tripId}/privatePacking，規則鎖定只有
//    本人（同一個 Google 帳號）能讀寫，這樣換手機、換電腦都看得到同一份個人清單。
//  - 沒有登入 Google（純連結分享）：沒有辦法讓系統知道「這兩台裝置是同一個人」，只好跟以前一樣
//    存在這個瀏覽器的 localStorage，真的不會離開這台裝置。
const PRIVATE_PACKING_KEY_PREFIX = "travel-app-private-packing-";
const privatePackingListeners = [];

function isPrivatePackingCloud() {
  return usingRealFirebase && Boolean(firebase.auth().currentUser) && !firebase.auth().currentUser.isAnonymous;
}

function privatePackingCloudCollection(tripId) {
  return "users/" + firebase.auth().currentUser.uid + "/trips/" + tripId + "/privatePacking";
}

function privatePackingKey(tripId) {
  return PRIVATE_PACKING_KEY_PREFIX + tripId;
}

function readPrivatePackingItems(tripId) {
  try {
    const raw = localStorage.getItem(privatePackingKey(tripId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePrivatePackingItems(tripId, items) {
  try {
    localStorage.setItem(privatePackingKey(tripId), JSON.stringify(items));
  } catch (e) {
    console.warn("儲存個人行李項目失敗:", e);
  }
  privatePackingListeners.slice().forEach(function (fn) { fn(); });
}

window.addEventListener("storage", function (e) {
  if (e.key && e.key.indexOf(PRIVATE_PACKING_KEY_PREFIX) === 0) {
    privatePackingListeners.slice().forEach(function (fn) { fn(); });
  }
});

function addPrivatePackingItem(tripId, name) {
  if (isPrivatePackingCloud()) {
    db.collection(privatePackingCloudCollection(tripId)).add({
      name: name,
      checked: false,
      createdAt: firebase.firestore.Timestamp.now(),
    });
    return;
  }
  const items = readPrivatePackingItems(tripId);
  items.push({ id: generateId(12), name: name, checked: false, createdAt: Date.now() });
  writePrivatePackingItems(tripId, items);
}

// item 要傳整筆資料（不只 id），因為雲端模式要知道目前的打勾狀態才能切換
function togglePrivatePackingItem(tripId, item) {
  if (isPrivatePackingCloud()) {
    db.doc(privatePackingCloudCollection(tripId) + "/" + item.id).update({ checked: !item.checked });
    return;
  }
  const items = readPrivatePackingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === item.id; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], { checked: !items[idx].checked });
    writePrivatePackingItems(tripId, items);
  }
}

function renamePrivatePackingItem(tripId, itemId, name) {
  if (isPrivatePackingCloud()) {
    db.doc(privatePackingCloudCollection(tripId) + "/" + itemId).update({ name: name });
    return;
  }
  const items = readPrivatePackingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], { name: name });
    writePrivatePackingItems(tripId, items);
  }
}

function removePrivatePackingItem(tripId, itemId) {
  if (isPrivatePackingCloud()) {
    db.doc(privatePackingCloudCollection(tripId) + "/" + itemId).delete();
    return;
  }
  writePrivatePackingItems(tripId, readPrivatePackingItems(tripId).filter(function (i) { return i.id !== itemId; }));
}

// 登入 Google 之後，把這台裝置上原本「只存在本機」的個人行李項目一次搬到雲端，
// 搬完清空本機那份，避免兩邊各留一份、之後對不起來
async function migratePrivatePackingToCloud(tripId) {
  const localItems = readPrivatePackingItems(tripId);
  if (localItems.length === 0 || !isPrivatePackingCloud()) return 0;
  const batch = db.batch();
  const col = db.collection(privatePackingCloudCollection(tripId));
  localItems.forEach(function (item) {
    const ref = col.doc();
    batch.set(ref, { name: item.name, checked: Boolean(item.checked), createdAt: firebase.firestore.Timestamp.now() });
  });
  await batch.commit();
  writePrivatePackingItems(tripId, []);
  return localItems.length;
}
