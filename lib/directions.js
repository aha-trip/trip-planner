// 用 Google Directions API 算兩點間的交通時間/距離。沒有金鑰時回傳 null，呼叫端要退回手動輸入。

const TRANSPORT_MODE_MAP = {
  walk: "WALKING",
  drive: "DRIVING",
  taxi: "DRIVING",
  transit: "TRANSIT",
  bike: "BICYCLING",
};

function calculateTravelTime(origin, destination, transportMode) {
  const promise = loadGoogleMaps();
  if (!promise) return Promise.resolve(null);
  if (origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
    return Promise.resolve(null);
  }

  return promise.then(function (google) {
    const service = new google.maps.DirectionsService();
    const travelMode = TRANSPORT_MODE_MAP[transportMode] || "DRIVING";

    return new Promise(function (resolve) {
      service.route(
        {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode[travelMode],
        },
        function (result, status) {
          if (status !== "OK" || !result.routes[0] || !result.routes[0].legs[0]) {
            console.warn("Directions API 查無路線:", status);
            resolve(null);
            return;
          }
          const leg = result.routes[0].legs[0];
          resolve({
            minutes: Math.round(leg.duration.value / 60),
            meters: leg.distance.value,
          });
        }
      );
    });
  });
}
