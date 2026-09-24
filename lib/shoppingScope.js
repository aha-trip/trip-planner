// 購物項目「分享範圍」的判斷與事後修改：所有人 / 指定對象 / 只有我。
// 「只有我」存在本機 localStorage，「所有人 / 指定對象」存在共用資料庫，所以在兩邊之間切換要搬資料。

function scopeOfItem(item) {
  if (item.isPrivate) return "private";
  if (item.visibleTo && item.visibleTo.length > 0) return "specific";
  return "everyone";
}

async function shoppingImageToFile(imageUrl) {
  // base64 資料網址直接自己解碼，不用 fetch（省掉不必要的網路請求，也比較不會被瀏覽器擋）
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(imageUrl);
  if (match && match[2]) {
    const bin = atob(match[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], "shopping.png", { type: match[1] || "image/png" });
  }
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new File([blob], "shopping.png", { type: blob.type || "image/png" });
}

async function changeShoppingScope(tripId, item, newMode, selectedMembers) {
  const oldMode = scopeOfItem(item);
  const sharedPath = "trips/" + tripId + "/shoppingItems/" + item.id;

  if (oldMode !== "private" && newMode !== "private") {
    await db.doc(sharedPath).update({ visibleTo: newMode === "specific" ? selectedMembers : null });
    return;
  }

  if (oldMode !== "private" && newMode === "private") {
    // 分享 -> 只有我：先存進本機，再把共用資料庫那筆真的刪掉（不能只是隱藏，否則別人還讀得到）
    addPrivateShoppingItemRaw(tripId, {
      imageUrl: item.imageUrl,
      imagePath: item.imagePath || null,
      caption: item.caption || "",
      linkedWishlistItemId: item.linkedWishlistItemId || null,
      addedBy: item.addedBy,
    });
    await db.doc(sharedPath).delete();
    return;
  }

  if (oldMode === "private" && newMode !== "private") {
    // 只有我 -> 分享：圖片是本機的 base64 就要先上傳；如果本來就是網址就直接沿用
    let imageUrl = item.imageUrl;
    let imagePath = item.imagePath || null;
    if (imageUrl.indexOf("data:") === 0) {
      const file = await shoppingImageToFile(imageUrl);
      imagePath = "trips/" + tripId + "/shopping/" + generateId(12) + "-shopping.png";
      const ref = storage.ref(imagePath);
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }
    await db.collection("trips/" + tripId + "/shoppingItems").add({
      imageUrl: imageUrl,
      imagePath: imagePath,
      caption: item.caption || "",
      linkedWishlistItemId: item.linkedWishlistItemId || null,
      addedBy: item.addedBy,
      visibleTo: newMode === "specific" ? selectedMembers : null,
      createdAt: firebase.firestore.Timestamp.now(),
    });
    removePrivateShoppingItem(tripId, item.id);
  }
}
