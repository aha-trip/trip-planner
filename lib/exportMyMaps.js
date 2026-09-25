// 把願望清單匯出成 CSV，可以匯入 Google My Maps（mymaps.google.com）一次建立整張地圖。
// Google 地圖「已儲存」裡的清單沒有公開的 API 可以自動建立，所以用匯入 My Maps 這個官方支援的方式。
function csvCell(value) {
  const s = value == null ? "" : String(value);
  return '"' + s.replace(/"/g, '""') + '"';
}

function buildWishlistCsv(items) {
  const header = ["名稱", "地址", "緯度", "經度", "類別", "備註", "Google地圖連結"];
  const rows = items.map(function (w) {
    return [
      w.name,
      w.address || "",
      w.lat != null ? w.lat : "",
      w.lng != null ? w.lng : "",
      CATEGORY_LABELS[w.category] || w.category || "",
      w.notes || "",
      buildPlaceLink(w),
    ];
  });
  return [header].concat(rows).map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
}

function downloadWishlistCsv(items, tripName) {
  // 開頭加 BOM，Excel / Google 才會把中文當 UTF-8 讀
  const blob = new Blob(["﻿" + buildWishlistCsv(items)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (tripName || "願望清單").replace(/[\/:*?"<>|]/g, "_") + "-願望清單.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
