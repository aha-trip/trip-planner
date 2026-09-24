// 「只有我看得到」的購物清單項目：完全不會寫進 Firestore/本機共用資料庫，只存在這個瀏覽器的
// localStorage，圖片直接轉成 base64 存本機，不會經過 Cloudinary/Firebase Storage 上傳，
// 保證不會同步給其他行程成員——不是用一個「隱藏旗標」假裝私密，是真的沒有離開這台裝置。

const PRIVATE_SHOPPING_KEY_PREFIX = "travel-app-private-shopping-";
const privateShoppingListeners = [];

function privateShoppingKey(tripId) {
  return PRIVATE_SHOPPING_KEY_PREFIX + tripId;
}

function readPrivateShoppingItems(tripId) {
  try {
    const raw = localStorage.getItem(privateShoppingKey(tripId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePrivateShoppingItems(tripId, items) {
  try {
    localStorage.setItem(privateShoppingKey(tripId), JSON.stringify(items));
  } catch (e) {
    console.warn("儲存私人購物項目失敗:", e);
  }
  notifyPrivateShoppingListeners();
}

function notifyPrivateShoppingListeners() {
  privateShoppingListeners.slice().forEach(function (fn) { fn(); });
}

window.addEventListener("storage", function (e) {
  if (e.key && e.key.indexOf(PRIVATE_SHOPPING_KEY_PREFIX) === 0) {
    notifyPrivateShoppingListeners();
  }
});

function fileToDataUrl(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(new Error("讀取檔案失敗")); };
    reader.readAsDataURL(file);
  });
}

async function addPrivateShoppingItem(tripId, file, fields) {
  const imageUrl = await fileToDataUrl(file);
  const items = readPrivateShoppingItems(tripId);
  const item = Object.assign(
    { id: generateId(12), imageUrl: imageUrl, createdAt: Date.now() },
    fields
  );
  items.push(item);
  writePrivateShoppingItems(tripId, items);
  return item;
}

function updatePrivateShoppingItem(tripId, itemId, patch) {
  const items = readPrivateShoppingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], patch);
    writePrivateShoppingItems(tripId, items);
  }
}

