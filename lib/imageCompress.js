// 上傳前先縮圖：手機相簿的照片常常 5～12MB，超過 Cloudinary 免費方案的單檔上限(10MB)，
// 存進本機 localStorage 也會爆掉（約 5MB 上限）。縮成最長邊 1600px、JPEG 品質 0.8 通常只剩 200～500KB，
// 購物截圖看得很清楚。任何一步失敗就直接回傳原檔，不擋使用者。
function compressImage(file, maxEdge, quality) {
  maxEdge = maxEdge || 1600;
  quality = quality || 0.8;
  return new Promise(function (resolve) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0 || file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
          resolve(new File([blob], baseName + ".jpg", { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      } catch (e) {
        resolve(file);
      }
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
