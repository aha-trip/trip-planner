// 距離相關的小工具（不需要任何 API）
function hasCoords(item) {
  return Boolean(item) && typeof item.lat === "number" && typeof item.lng === "number";
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = function (d) { return d * Math.PI / 180; };
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 1000) return Math.max(10, Math.round(meters / 10) * 10) + " 公尺";
  return (meters / 1000).toFixed(1) + " 公里";
}

// 直線距離 x 1.3 當作實際走路距離的估算，時速約 4.8 公里（每分鐘 80 公尺）
function walkingMinutes(meters) {
  return Math.max(1, Math.round(meters * 1.3 / 80));
}
