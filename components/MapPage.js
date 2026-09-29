// 願望清單地圖：跟 Funliday 同款的 MapLibre GL（免費、開源，不是 Google Maps，不用金鑰），
// 圖磚用 OpenFreeMap（完全免費、沒有用量限制）。圖釘可以拖曳修正位置，查到一次就存回 Firestore。
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function MapPage({ tripId, trip, nickname, focusItemId }) {
  const { data: rawItems, loading } = useCollection("trips/" + tripId + "/wishlistItems");
  const { data: rawItineraryItems } = useCollection("trips/" + tripId + "/itineraryItems");

  const allItems = rawItems.filter(function (w) { return !w.deletedAt; });
  const itineraryItems = rawItineraryItems.filter(function (i) { return !i.deletedAt; });
  const dayList = getTripDayList(trip, itineraryItems);
  const scheduledDatesByItem = {};
  itineraryItems.forEach(function (i) {
    if (!scheduledDatesByItem[i.wishlistItemId]) scheduledDatesByItem[i.wishlistItemId] = [];
    scheduledDatesByItem[i.wishlistItemId].push(i.date);
  });
  Object.keys(scheduledDatesByItem).forEach(function (id) { scheduledDatesByItem[id].sort(); });

  const withCoords = allItems.filter(hasCoords);
  const withoutCoords = allItems.filter(function (w) { return !hasCoords(w); });

  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef({});
  const centeredRef = React.useRef(false);
  const mapLoadedRef = React.useRef(false);
  const [mapReady, setMapReady] = React.useState(false);
  const [geocoding, setGeocoding] = React.useState(false);
  const [progress, setProgress] = React.useState(null);

  React.useEffect(function () {
    if (!containerRef.current || mapRef.current || typeof maplibregl === "undefined") return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [0, 20],
      zoom: 1.5,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right"
    );
    map.on("load", function () {
      mapLoadedRef.current = true;
      setMapReady(true);
    });
    mapRef.current = map;
    return function () {
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, []);

  function buildPopupContent(item) {
    const wrap = document.createElement("div");
    wrap.style.minWidth = "170px";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.marginBottom = "2px";
    title.textContent = item.name;
    wrap.appendChild(title);

    const meta = document.createElement("div");
    meta.style.fontSize = "12px";
    meta.style.color = "#94a3b8";
    const dates = scheduledDatesByItem[item.id];
    meta.textContent =
      (CATEGORY_LABELS[item.category] || item.category) +
      (dates && dates.length ? " · 已排程 " + dates.map(function (d) { return d.slice(5); }).join("、") : "");
    wrap.appendChild(meta);

    if (dayList.length > 0) {
      const row = document.createElement("div");
      row.style.marginTop = "6px";
      row.style.display = "flex";
      row.style.gap = "4px";

      const select = document.createElement("select");
      select.style.fontSize = "12px";
      select.style.flex = "1";
      select.style.minWidth = "0";
      dayList.forEach(function (d) {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        select.appendChild(opt);
      });

      const btn = document.createElement("button");
      btn.textContent = "＋加入";
      btn.style.fontSize = "12px";
      btn.style.padding = "4px 10px";
      btn.style.background = "#d4611a";
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.borderRadius = "6px";
      btn.onclick = function () {
        addWishlistItemToDay(tripId, item.id, select.value).then(function () {
          const marker = markersRef.current[item.id];
          if (marker) marker.getPopup().remove();
        });
      };

      row.appendChild(select);
      row.appendChild(btn);
      wrap.appendChild(row);
    }

    const hint = document.createElement("div");
    hint.style.fontSize = "11px";
    hint.style.color = "#cbb994";
    hint.style.marginTop = "6px";
    hint.textContent = "位置不準？按住圖釘拖到正確地方就會自動存檔";
    wrap.appendChild(hint);

    return wrap;
  }

  React.useEffect(function () {
    const map = mapRef.current;
    if (!map || !mapReady || typeof maplibregl === "undefined") return;
    const currentIds = {};
    withCoords.forEach(function (item) {
      currentIds[item.id] = true;
      let marker = markersRef.current[item.id];
      if (!marker) {
        marker = new maplibregl.Marker({ draggable: true, color: "#d4611a" })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
        marker.on("dragend", function () {
          const pos = marker.getLngLat();
          db.doc("trips/" + tripId + "/wishlistItems/" + item.id).update({ lat: pos.lat, lng: pos.lng }).catch(function () {});
        });
        markersRef.current[item.id] = marker;
      } else {
        const pos = marker.getLngLat();
        if (Math.abs(pos.lat - item.lat) > 1e-9 || Math.abs(pos.lng - item.lng) > 1e-9) {
          marker.setLngLat([item.lng, item.lat]);
        }
      }
      marker.setPopup(new maplibregl.Popup({ offset: 24 }).setDOMContent(buildPopupContent(item)));
    });
    Object.keys(markersRef.current).forEach(function (id) {
      if (!currentIds[id]) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
    // eslint-disable-next-line
  }, [mapReady, withCoords, dayList.join(","), tripId]);

  // 進到地圖分頁時，如果是從某個地點的「地圖上的附近地點」點進來，就直接飛到那個地點並打開它的小視窗；
  // 否則框住整個願望清單目前有座標的地點，讓使用者一眼看出哪些彼此靠近。只在剛進來時做一次，
  // 之後使用者自己拖曳/縮放過的視角不再打擾。
  React.useEffect(function () {
    if (!mapReady || centeredRef.current) return;
    if (focusItemId) {
      const target = withCoords.find(function (w) { return w.id === focusItemId; });
      if (!target) return; // 這個地點還沒有座標，等查到之後（withCoords 更新）再試一次
      mapRef.current.flyTo({ center: [target.lng, target.lat], zoom: 16 });
      centeredRef.current = true;
      const marker = markersRef.current[target.id];
      if (marker) marker.togglePopup();
      return;
    }
    if (withCoords.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    withCoords.forEach(function (w) { bounds.extend([w.lng, w.lat]); });
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
    centeredRef.current = true;
  }, [mapReady, withCoords, focusItemId]);

  async function geocodeAllMissing() {
    setGeocoding(true);
    setProgress({ done: 0, total: withoutCoords.length });
    for (let i = 0; i < withoutCoords.length; i++) {
      const w = withoutCoords[i];
      const r = await geocodePlace(w, trip.destination);
      if (r) {
        await db.doc("trips/" + tripId + "/wishlistItems/" + w.id).update({ lat: r.lat, lng: r.lng }).catch(function () {});
      }
      setProgress({ done: i + 1, total: withoutCoords.length });
    }
    setGeocoding(false);
    setProgress(null);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
        <PinIcon className="w-5 h-5 text-brand-600" /> 地圖
      </h2>
      <div ref={containerRef} className="w-full h-[78vh] min-h-[480px] rounded-xl border border-amber-100 overflow-hidden" />
      <p className="text-[11px] text-slate-400">
        地圖引擎：MapLibre GL（開源、免費）・圖磚：© OpenFreeMap、© OpenMapTiles、© OpenStreetMap contributors。
        按地圖右上角的定位圖示可以顯示你目前的位置；圖釘可以按住拖曳修正位置，會自動存檔。
      </p>

      {loading && <p className="text-slate-400 text-sm">載入中...</p>}
      {!loading && allItems.length === 0 && <p className="text-slate-400 text-sm">願望清單還是空的，先加一些想去的地方吧！</p>}

      {withoutCoords.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 p-3">
          <p className="text-sm text-slate-600 mb-2">
            還有 {withoutCoords.length} 個地點沒有座標，不會顯示在地圖上：{withoutCoords.map(function (w) { return w.name; }).join("、")}
          </p>
          {geocoding ? (
            <p className="text-sm text-slate-500">查詢中… {progress.done}/{progress.total}（每個約 1～5 秒）</p>
          ) : (
            <button
              onClick={geocodeAllMissing}
              className="min-h-[40px] px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm"
            >
              幫我查詢這些地點的座標
            </button>
          )}
        </div>
      )}
    </div>
  );
}
