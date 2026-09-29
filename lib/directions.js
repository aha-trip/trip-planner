// 算兩點間的交通時間/距離。有設定 Google Maps 金鑰就用 Google Directions（比較準，含大眾運輸）；
// 沒有金鑰就用免費的 OSRM 公開路線服務（走路/騎車/開車，不用金鑰，但沒有大眾運輸路線資料）；
// 兩者都查不到（例如大眾運輸又沒有 Google 金鑰）才回傳 null，畫面會退回手動輸入。

const TRANSPORT_MODE_MAP = {
  walk: "WALKING",
  drive: "DRIVING",
  taxi: "DRIVING",
  transit: "TRANSIT",
  bike: "BICYCLING",
};

// FOSSGIS（OpenStreetMap 德國分會）維運的免費公開路線服務，不用註冊、不用金鑰，
// 使用規範是不要用於大量／商業流量，一趟旅遊規劃的用量遠遠用不到那個門檻。
const OSRM_PROFILE_MAP = { walk: "foot", bike: "bike", drive: "car", taxi: "car" };

async function calculateTravelTimeFree(origin, destination, transportMode) {
  const profile = OSRM_PROFILE_MAP[transportMode];
  if (!profile) return null; // 大眾運輸沒有免費又可靠的公開路線資料，退回手動輸入
  const url =
    "https://routing.openstreetmap.de/routed-" + profile + "/route/v1/" + profile + "/" +
    origin.lng + "," + origin.lat + ";" + destination.lng + "," + destination.lat +
    "?overview=false";
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== "Ok" || !json.routes || !json.routes[0]) return null;
    return { minutes: Math.round(json.routes[0].duration / 60), meters: Math.round(json.routes[0].distance) };
  } catch (e) {
    return null;
  }
}

async function calculateTravelTime(origin, destination, transportMode) {
  if (origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
    return null;
  }
  if (CONFIG.googleMapsApiKey) {
    const g = await calculateTravelTimeGoogle(origin, destination, transportMode);
    if (g) return g;
  }
  return calculateTravelTimeFree(origin, destination, transportMode);
}

function calculateTravelTimeGoogle(origin, destination, transportMode) {
  const promise = loadGoogleMaps();
  if (!promise) return Promise.resolve(null);

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
