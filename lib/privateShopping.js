// 「只有我看得到」的購物清單項目，兩種存放方式：
//  - 有用 Google 登入：圖片上傳到跟「分享」項目一樣的圖床（Cloudinary/Storage），網址存在
//    Firestore 的 users/{uid}/trips/{tripId}/privateShopping，規則鎖定只有本人能讀寫這份資料，
//    這樣換手機、換電腦登入同一個帳號都看得到。注意：圖床本身是「知道網址就看得到」的空間，
//    跟分享項目共用，只是網址不會被公開列出來、沒人分享給你就找不到——不是完全不離開裝置的等級，
//    是用換取跨裝置同步的取捨。
//  - 沒有登入 Google：維持原本做法，圖片轉成 base64 直接存這個瀏覽器的 localStorage，
//    真的不會離開這台裝置，但也沒辦法跨裝置同步。
const PRIVATE_SHOPPING_KEY_PREFIX = "travel-app-private-shopping-";
const privateShoppingListeners = [];

function isPrivateShoppingCloud() {
  return usingRealFirebase && Boolean(firebase.auth().currentUser) && !firebase.auth().currentUser.isAnonymous;
}

function privateShoppingCloudCollection(tripId) {
  return "users/" + firebase.auth().currentUser.uid + "/trips/" + tripId + "/privateShopping";
}

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
  let saved = true;
  try {
    localStorage.setItem(privateShoppingKey(tripId), JSON.stringify(items));
  } catch (e) {
    saved = false;
    console.warn("儲存私人購物項目失敗:", e);
  }
  notifyPrivateShoppingListeners();
  return saved;
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

function dataUrlToFile(dataUrl) {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(dataUrl);
  if (!match || !match[2]) return null;
  const bin = atob(match[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], "shopping.png", { type: match[1] || "image/png" });
}

async function uploadPrivateShoppingImage(tripId, file) {
  const safeName = (file.name || "photo.jpg").replace(/[^\w.\-]/g, "_");
  const path = "trips/" + tripId + "/private-shopping/" + generateId(12) + "-" + safeName;
  const ref = storage.ref(path);
  await ref.put(file);
  const imageUrl = await ref.getDownloadURL();
  return { imageUrl: imageUrl, imagePath: path };
}

async function addPrivateShoppingItem(tripId, file, fields) {
  if (isPrivateShoppingCloud()) {
    const uploaded = await uploadPrivateShoppingImage(tripId, file);
    const doc = Object.assign({ createdAt: firebase.firestore.Timestamp.now() }, uploaded, fields);
    const ref = await db.collection(privateShoppingCloudCollection(tripId)).add(doc);
    return Object.assign({ id: ref.id }, doc);
  }
  const imageUrl = await fileToDataUrl(file);
  const items = readPrivateShoppingItems(tripId);
  const item = Object.assign({ id: generateId(12), imageUrl: imageUrl, createdAt: Date.now() }, fields);
  items.push(item);
  if (!writePrivateShoppingItems(tripId, items)) {
    throw new Error("瀏覽器儲存空間不足，請改選「分享」，或先刪掉一些「只有我」的項目");
  }
  return item;
}

function updatePrivateShoppingItem(tripId, itemId, patch) {
  if (isPrivateShoppingCloud()) {
    db.doc(privateShoppingCloudCollection(tripId) + "/" + itemId).update(patch);
    return;
  }
  const items = readPrivateShoppingItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], patch);
    writePrivateShoppingItems(tripId, items);
  }
}

// 已經有圖片網址（例如從「分享」改成「只有我」時，圖片本來就上傳過了）直接寫進清單，不用重傳
function addPrivateShoppingItemRaw(tripId, data) {
  if (isPrivateShoppingCloud()) {
    db.collection(privateShoppingCloudCollection(tripId)).add(
      Object.assign({ createdAt: firebase.firestore.Timestamp.now() }, data)
    );
    return;
  }
  const items = readPrivateShoppingItems(tripId);
  const item = Object.assign({ id: generateId(12), createdAt: Date.now() }, data);
  items.push(item);
  writePrivateShoppingItems(tripId, items);
  return item;
}

function removePrivateShoppingItem(tripId, itemId) {
  if (isPrivateShoppingCloud()) {
    db.doc(privateShoppingCloudCollection(tripId) + "/" + itemId).delete();
    return;
  }
  const items = readPrivateShoppingItems(tripId).filter(function (i) { return i.id !== itemId; });
  writePrivateShoppingItems(tripId, items);
}

// 登入 Google 之後，把這台裝置上原本只存在本機（base64）的私人購物截圖，一張一張傳到雲端圖床、
// 搬進帳號底下的雲端清單，搬完清空本機那份。回傳搬了幾筆、幾筆失敗（例如圖片損毀）。
async function migratePrivateShoppingToCloud(tripId) {
  const localItems = readPrivateShoppingItems(tripId);
  if (localItems.length === 0 || !isPrivateShoppingCloud()) return { moved: 0, failed: 0 };
  let moved = 0;
  let failed = 0;
  const remaining = [];
  for (let i = 0; i < localItems.length; i++) {
    const item = localItems[i];
    try {
      let imageUrl = item.imageUrl;
      let imagePath = item.imagePath || null;
      if (imageUrl && imageUrl.indexOf("data:") === 0) {
        const file = dataUrlToFile(imageUrl);
        if (!file) throw new Error("圖片格式無法辨識");
        const uploaded = await uploadPrivateShoppingImage(tripId, file);
        imageUrl = uploaded.imageUrl;
        imagePath = uploaded.imagePath;
      }
      await db.collection(privateShoppingCloudCollection(tripId)).add({
        imageUrl: imageUrl,
        imagePath: imagePath,
        caption: item.caption || "",
        linkedWishlistItemId: item.linkedWishlistItemId || null,
        addedBy: item.addedBy || "匿名",
        createdAt: firebase.firestore.Timestamp.now(),
      });
      moved++;
    } catch (e) {
      console.error("搬移私人購物項目失敗:", e);
      failed++;
      remaining.push(item);
    }
  }
  writePrivateShoppingItems(tripId, remaining);
  return { moved: moved, failed: failed };
}
