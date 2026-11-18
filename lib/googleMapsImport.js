// 讓使用者把 Google 地圖上搜到的地點，用「分享」複製連結、貼到 ZouLa 就能自動帶出名稱/地址/座標，
// 不用自己重新打一次地點名稱再搜尋一次。純前端解析＋既有的 Places/Geocoder 函式庫，不需要後端。
//
// ⚠️ 誠實聲明一個限制：手機 Google 地圖 App 的「分享」預設給的是縮短過的連結
// （https://maps.app.goo.gl/xxxx），裡面真正的地點資訊要跟 Google 的伺服器要一次重新導向
// 才能知道，瀏覽器的安全限制（CORS）不允許網頁用程式碼自己去問「這個縮短連結實際指到哪裡」，
// 一定要是「真的開啟這個連結」才會看到完整網址。所以縮短連結沒辦法在這裡直接解析，
// 只能請使用者自己先點開一次（網址列出現完整的 google.com/maps/... 字串後）再複製貼上。
function parseGoogleMapsUrl(raw) {
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch (e) {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const isShortlink = host === "maps.app.goo.gl" || (host === "goo.gl" && url.pathname.indexOf("/maps") === 0);
  if (isShortlink) return { kind: "shortlink" };

  const isMapsHost = host === "google.com" || host === "maps.google.com";
  if (!isMapsHost || url.pathname.indexOf("/maps") !== 0) return null;

  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  const coordMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const name = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) : null;

  const qParam = url.searchParams.get("q");
  if (qParam) {
    const qCoordMatch = qParam.match(/^(-?\d+\.\d+),(-?\d+\.\d+)$/);
    if (qCoordMatch) {
      return { kind: "coords", name: name, lat: parseFloat(qCoordMatch[1]), lng: parseFloat(qCoordMatch[2]) };
    }
    if (qParam.indexOf("place_id:") === 0) {
      return { kind: "placeId", placeId: qParam.slice("place_id:".length), name: name };
    }
    if (!name && !coordMatch) {
      return { kind: "query", query: qParam };
    }
  }

  const queryPlaceId = url.searchParams.get("query_place_id");
  if (queryPlaceId) {
    return { kind: "placeId", placeId: queryPlaceId, name: name || url.searchParams.get("query") };
  }

  if (coordMatch) {
    return { kind: "coords", name: name, lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }

  if (name) {
    return { kind: "query", query: name };
  }

  return null;
}

// 原生 App 裡沒有瀏覽器那套 CORS 限制：Capacitor 內建的 CapacitorHttp 外掛是用手機本機的
// 網路功能發 GET 請求，不是網頁的 fetch()，所以可以直接追蹤縮短連結的重新導向、拿到真正指到
// 哪裡的完整網址。網頁版（沒有原生外殼）還是沒辦法，只能退回下面「請使用者自己開一次」的做法。
async function resolveShortGoogleMapsUrlNative(rawUrl) {
  if (!(window.Capacitor && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins.CapacitorHttp)) return null;
  try {
    const res = await window.Capacitor.Plugins.CapacitorHttp.request({ method: "GET", url: rawUrl });
    return (res && res.url) || null;
  } catch (e) {
    return null;
  }
}

// 回傳 { ok: true, name, address, lat, lng, placeId } 或 { ok: false, reason }
// reason: "not-maps-url" | "shortlink" | "place-not-found" | "unresolved"
async function resolveGoogleMapsUrl(raw) {
  const parsed = parseGoogleMapsUrl(raw);
  if (!parsed) return { ok: false, reason: "not-maps-url" };

  if (parsed.kind === "shortlink") {
    const resolvedUrl = await resolveShortGoogleMapsUrlNative(raw);
    const reParsed = resolvedUrl ? parseGoogleMapsUrl(resolvedUrl) : null;
    if (reParsed && reParsed.kind !== "shortlink") return resolveGoogleMapsUrl(resolvedUrl);
    return { ok: false, reason: "shortlink" };
  }

  if (parsed.kind === "placeId") {
    const detail = await fetchPlaceById(parsed.placeId);
    if (detail) return Object.assign({ ok: true }, detail);
    return { ok: false, reason: "place-not-found" };
  }

  if (parsed.kind === "coords") {
    const reverse = await reverseGeocode(parsed.lat, parsed.lng);
    return {
      ok: true,
      name: parsed.name || (reverse && reverse.name) || "",
      address: (reverse && reverse.address) || "",
      lat: parsed.lat,
      lng: parsed.lng,
      placeId: null,
    };
  }

  if (parsed.kind === "query") {
    const geo = await geocodePlace({ name: parsed.query });
    return {
      ok: true,
      name: parsed.query,
      address: "",
      lat: geo ? geo.lat : null,
      lng: geo ? geo.lng : null,
      placeId: null,
    };
  }

  return { ok: false, reason: "unresolved" };
}
