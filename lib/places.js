// 動態載入 Google Maps JavaScript API (含 Places library)，全站共用同一個 loading promise。
// 沒有設定金鑰時 googleMapsLoadPromise 會是 null，呼叫端要檢查並退回手動輸入。

var googleMapsLoadPromise = null;

function loadGoogleMaps() {
  if (!CONFIG.googleMapsApiKey) return null;
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise(function (resolve, reject) {
    const callbackName = "__onGoogleMapsLoaded";
    window[callbackName] = function () {
      resolve(window.google);
      delete window[callbackName];
    };
    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(CONFIG.googleMapsApiKey) +
      "&libraries=places&callback=" +
      callbackName;
    script.onerror = function () {
      reject(new Error("Google Maps 載入失敗"));
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// 把 Google Places Autocomplete 掛到一個 <input> 上，選到地點時呼叫 onPlaceSelected({name, address, lat, lng, placeId})
function attachPlacesAutocomplete(inputEl, onPlaceSelected) {
  const promise = loadGoogleMaps();
  if (!promise || !inputEl) return function () {};

  let autocomplete = null;
  let cancelled = false;

  promise.then(function (google) {
    if (cancelled || !inputEl.isConnected) return;
    autocomplete = new google.maps.places.Autocomplete(inputEl, {
      fields: ["name", "formatted_address", "geometry", "place_id"],
    });
    autocomplete.addListener("place_changed", function () {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry) return;
      onPlaceSelected({
        name: place.name || inputEl.value,
        address: place.formatted_address || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        placeId: place.place_id || null,
      });
    });
  });

  return function cleanup() {
    cancelled = true;
    if (autocomplete && window.google) {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    }
  };
}

// 從 Google 地圖分享連結貼上時，如果連結裡帶的是 place_id（例如 query_place_id= 或
// ?q=place_id:... 這種格式），用這個查到完整的名稱/地址/座標——跟 Autocomplete 用的
// 是同一支 Places JS 函式庫，純前端呼叫，不用額外的後端代理。
function fetchPlaceById(placeId) {
  const promise = loadGoogleMaps();
  if (!promise) return Promise.resolve(null);
  return promise
    .then(function (google) {
      return new Promise(function (resolve) {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          { placeId: placeId, fields: ["name", "formatted_address", "geometry", "place_id"] },
          function (place, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
              resolve({
                name: place.name || "",
                address: place.formatted_address || "",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                placeId: place.place_id || placeId,
              });
            } else {
              resolve(null);
            }
          }
        );
      });
    })
    .catch(function () { return null; });
}
