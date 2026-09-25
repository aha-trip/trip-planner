// 把地點名稱/地址查成座標。有設定 Google Maps 金鑰就先用 Google，查不到或沒設定就用免費的 OpenStreetMap (Nominatim)。
// Nominatim 使用規範：每秒最多 1 次請求，所以所有查詢排成一條隊伍、每次間隔 1.1 秒。
let geocodeChain = Promise.resolve();

function geocodeSleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function geocodeWithGoogle(query) {
  const promise = loadGoogleMaps();
  if (!promise) return null;
  try {
    const google = await promise;
    return await new Promise(function (resolve) {
      new google.maps.Geocoder().geocode({ address: query }, function (results, status) {
        if (status === "OK" && results[0]) {
          resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng(), source: "google" });
        } else {
          resolve(null);
        }
      });
    });
  } catch (e) {
    return null;
  }
}

async function geocodeWithOsm(query) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=zh-TW&q=" + encodeURIComponent(query);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.length) return null;
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon), source: "osm" };
  } catch (e) {
    return null;
  }
}

// 手動輸入或 Google 格式的地址常常帶「郵遞區號 + 國名」或門牌號碼，OpenStreetMap 不一定查得到，
// 所以由完整到簡化準備幾種查詢寫法，依序試到查到為止。
function geocodeQueries(item, context) {
  const list = [];
  const addr = (item.address || "").trim();
  if (addr) {
    list.push(addr);
    let cleaned = addr;
    if (/[A-Za-z]/.test(cleaned)) cleaned = cleaned.replace(/[㐀-鿿]+\s*$/, "");
    cleaned = cleaned.replace(/[\s,]*\d{4,6}\s*$/, "").trim();
    if (cleaned && cleaned !== addr) list.push(cleaned);
    const noHouseNo = cleaned.replace(/^\s*[\d\-\/]+[A-Za-z]?\s+/, "");
    if (noHouseNo && noHouseNo !== cleaned) list.push(noHouseNo);
    // 中文地址：逐步去掉樓層、門牌、巷弄，退到「路名」也算（附近推薦只需要大致位置）
    let zh = cleaned.replace(/\s+/g, "");
    if (/[㐀-鿿]/.test(zh)) {
      const steps = [/[\d０-９一二三四五六七八九十]+樓.*$/, /之[\d]+/g, /[\d０-９]+號.*$/, /[\d０-９]+弄.*$/, /[\d０-９]+巷.*$/];
      steps.forEach(function (re) {
        const next = zh.replace(re, "");
        if (next && next !== zh) { zh = next; list.push(zh); }
      });
    }
    // 英文/泰文等以逗號分隔的地址：由細到粗逐段去掉前面的部分
    const parts = cleaned.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    for (let k = 1; k <= Math.min(3, parts.length - 1); k++) {
      list.push(parts.slice(k).join(", "));
    }
  }
  if (item.name) {
    if (context) list.push(item.name + " " + context);
    list.push(item.name);
  }
  const seen = {};
  return list.filter(function (q) {
    if (!q || seen[q]) return false;
    seen[q] = true;
    return true;
  }).slice(0, 8);
}

async function geocodeOnce(item, context) {
  const queries = geocodeQueries(item, context);
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    if (CONFIG.googleMapsApiKey) {
      const g = await geocodeWithGoogle(q);
      if (g) return g;
    }
    const o = await geocodeWithOsm(q);
    if (o) return o;
    await geocodeSleep(1100);
  }
  return null;
}

// 回傳 {lat, lng, source} 或 null（查不到）
function geocodePlace(item, context) {
  const job = geocodeChain.then(function () { return geocodeOnce(item, context); });
  geocodeChain = job.then(function () { return geocodeSleep(1100); }, function () { return geocodeSleep(1100); });
  return job;
}
