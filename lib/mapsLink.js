// 產生 Google Maps 連結，不需要 API 金鑰。

// 用座標導航（有座標時最準）
function buildNavigationLink(item) {
  if (item.lat != null && item.lng != null) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + item.lat + "," + item.lng;
  }
  return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(item.address || item.name || "");
}

// 用地址/名稱搜尋（沒有金鑰、沒有座標時的備案）
function buildSearchLink(query) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query || "");
}
