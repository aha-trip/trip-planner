// 「只有我看得到」的行李清單項目：不寫進 Firestore，只存在這個瀏覽器的 localStorage，
// 用法跟 lib/privateShopping.js 一樣（那邊存圖片，這邊只存文字跟打勾狀態）。
const PRIVATE_PACKING_KEY_PREFIX = "travel-app-private-packing-";
const privatePackingListeners = [];

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
  const items = readPrivatePackingItems(tripId);
  items.push({ id: generateId(12), name: name, checked: false, createdAt: Date.now() });
  writePrivatePackingItems(tripId, items);
}

function togglePrivatePackingItem(tripId, itemId) {
  const items = readPrivatePackingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], { checked: !items[idx].checked });
    writePrivatePackingItems(tripId, items);
  }
}

function renamePrivatePackingItem(tripId, itemId, name) {
  const items = readPrivatePackingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], { name: name });
    writePrivatePackingItems(tripId, items);
  }
}

function removePrivatePackingItem(tripId, itemId) {
  writePrivatePackingItems(tripId, readPrivatePackingItems(tripId).filter(function (i) { return i.id !== itemId; }));
}
