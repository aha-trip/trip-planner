// 「只有我看得到」的票券保管箱項目，存放方式跟 lib/privateShopping.js 完全一樣的取捨：
//  - 有用 Google 登入：圖片上傳到跟「分享」項目一樣的圖床，網址存在 Firestore 的
//    users/{uid}/trips/{tripId}/vaultItems，規則鎖定只有本人能讀寫，換裝置登入同帳號也看得到。
//  - 沒有登入 Google：圖片轉成 base64 存這個瀏覽器的 localStorage，真的不會離開這台裝置，
//    但也沒辦法跨裝置同步——這是護照、保單這類最敏感的憑證預設該選的模式。
const PRIVATE_VAULT_KEY_PREFIX = "travel-app-private-vault-";
const privateVaultListeners = [];

function isPrivateVaultCloud() {
  return usingRealFirebase && Boolean(firebase.auth().currentUser) && !firebase.auth().currentUser.isAnonymous;
}

function privateVaultCloudCollection(tripId) {
  return "users/" + firebase.auth().currentUser.uid + "/trips/" + tripId + "/vaultItems";
}

function privateVaultKey(tripId) {
  return PRIVATE_VAULT_KEY_PREFIX + tripId;
}

function readPrivateVaultItems(tripId) {
  try {
    const raw = localStorage.getItem(privateVaultKey(tripId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function writePrivateVaultItems(tripId, items) {
  let saved = true;
  try {
    localStorage.setItem(privateVaultKey(tripId), JSON.stringify(items));
  } catch (e) {
    saved = false;
    console.warn("儲存私人保管箱項目失敗:", e);
  }
  notifyPrivateVaultListeners();
  return saved;
}

function notifyPrivateVaultListeners() {
  privateVaultListeners.slice().forEach(function (fn) { fn(); });
}

window.addEventListener("storage", function (e) {
  if (e.key && e.key.indexOf(PRIVATE_VAULT_KEY_PREFIX) === 0) {
    notifyPrivateVaultListeners();
  }
});

async function uploadPrivateVaultImage(tripId, file) {
  const safeName = (file.name || "vault.jpg").replace(/[^\w.\-]/g, "_");
  const path = "trips/" + tripId + "/private-vault/" + generateId(12) + "-" + safeName;
  const ref = storage.ref(path);
  await ref.put(file);
  const imageUrl = await ref.getDownloadURL();
  return { imageUrl: imageUrl, imagePath: path };
}

// file 可以是 null（純文字憑證，例如只記預約編號沒有照片）
async function addPrivateVaultItem(tripId, file, fields) {
  if (isPrivateVaultCloud()) {
    const uploaded = file ? await uploadPrivateVaultImage(tripId, file) : {};
    const doc = Object.assign({ createdAt: firebase.firestore.Timestamp.now() }, uploaded, fields);
    const ref = await db.collection(privateVaultCloudCollection(tripId)).add(doc);
    return Object.assign({ id: ref.id }, doc);
  }
  const imageUrl = file ? await fileToDataUrl(file) : null;
  const items = readPrivateVaultItems(tripId);
  const item = Object.assign({ id: generateId(12), imageUrl: imageUrl, createdAt: Date.now() }, fields);
  items.push(item);
  if (!writePrivateVaultItems(tripId, items)) {
    throw new Error("瀏覽器儲存空間不足，請改選「分享」，或先刪掉一些「只有我」的項目");
  }
  return item;
}

function updatePrivateVaultItem(tripId, itemId, patch) {
  if (isPrivateVaultCloud()) {
    db.doc(privateVaultCloudCollection(tripId) + "/" + itemId).update(patch);
    return;
  }
  const items = readPrivateVaultItems(tripId);
  const idx = items.findIndex(function (i) { return i.id === itemId; });
  if (idx >= 0) {
    items[idx] = Object.assign({}, items[idx], patch);
    writePrivateVaultItems(tripId, items);
  }
}

function removePrivateVaultItem(tripId, itemId) {
  if (isPrivateVaultCloud()) {
    db.doc(privateVaultCloudCollection(tripId) + "/" + itemId).delete();
    return;
  }
  const items = readPrivateVaultItems(tripId).filter(function (i) { return i.id !== itemId; });
  writePrivateVaultItems(tripId, items);
}

// 登入 Google 之後，把這台裝置上原本只存在本機（base64）的私人保管箱項目搬到帳號底下
async function migratePrivateVaultToCloud(tripId) {
  const localItems = readPrivateVaultItems(tripId);
  if (localItems.length === 0 || !isPrivateVaultCloud()) return { moved: 0, failed: 0 };
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
        const uploaded = await uploadPrivateVaultImage(tripId, file);
        imageUrl = uploaded.imageUrl;
        imagePath = uploaded.imagePath;
      }
      await db.collection(privateVaultCloudCollection(tripId)).add({
        category: item.category || "other",
        title: item.title || "",
        startsAt: item.startsAt || null,
        confirmationCode: item.confirmationCode || "",
        notes: item.notes || "",
        imageUrl: imageUrl,
        imagePath: imagePath,
        linkedWishlistItemId: item.linkedWishlistItemId || null,
        addedBy: item.addedBy || "匿名",
        usedAt: item.usedAt || null,
        createdAt: firebase.firestore.Timestamp.now(),
      });
      moved++;
    } catch (e) {
      console.error("搬移私人保管箱項目失敗:", e);
      failed++;
      remaining.push(item);
    }
  }
  writePrivateVaultItems(tripId, remaining);
  return { moved: moved, failed: failed };
}
