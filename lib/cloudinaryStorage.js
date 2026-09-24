// 用 Cloudinary 的免費「未簽署上傳 (unsigned upload)」功能存購物清單截圖：
// 不需要信用卡、不需要自己的後端伺服器，直接從瀏覽器上傳。
//
// 限制：免登入的前端上傳沒辦法安全地做「刪除」（真的要刪 Cloudinary 上的檔案需要 API secret，
// 那種東西不能放在瀏覽器程式碼裡，會被任何人看到）。所以這裡的 delete() 只是讓介面跟
// Firebase Storage/本機模式保持一致，實際上不會真的刪除 Cloudinary 上的圖片——
// 只會把資料庫裡的那筆記錄刪掉（App 裡就看不到了）。免費額度通常很夠用，不影響正常使用。

function createCloudinaryStorage() {
  const cloudName = CONFIG.cloudinary.cloudName;
  const uploadPreset = CONFIG.cloudinary.uploadPreset;

  return {
    ref: function (path) {
      let uploadedUrl = null;
      const folder = path.split("/").slice(0, -1).join("/");

      return {
        put: function (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);
          if (folder) formData.append("folder", folder);

          return fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", {
            method: "POST",
            body: formData,
          })
            .then(function (res) {
              if (!res.ok) {
                return res.json().catch(function () { return {}; }).then(function (errBody) {
                  throw new Error("Cloudinary 上傳失敗: " + (errBody.error && errBody.error.message ? errBody.error.message : res.status));
                });
              }
              return res.json();
            })
            .then(function (json) {
              uploadedUrl = json.secure_url;
            });
        },
        getDownloadURL: function () {
          return Promise.resolve(uploadedUrl || "");
        },
        delete: function () {
          return Promise.resolve();
        },
      };
    },
  };
}
