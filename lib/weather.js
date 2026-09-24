// 取得某一天、某個座標的天氣預報，會先查 Firestore 共用快取，減少大家各自打 API 的次數。
// OpenWeatherMap 免費方案只能預報未來約 5 天，超過範圍會回傳 unavailable。

const WEATHER_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 小時

function weatherIconUrl(icon) {
  return "https://openweathermap.org/img/wn/" + icon + "@2x.png";
}

async function getWeatherForDay(tripId, date, lat, lng) {
  if (!CONFIG.openWeatherApiKey) {
    return { unavailable: true, reason: "no-api-key" };
  }
  if (lat == null || lng == null) {
    return { unavailable: true, reason: "no-location" };
  }

  const cachePath = "trips/" + tripId + "/weatherCache/" + date;

  if (firebaseEnabled) {
    try {
      await authReadyPromise;
      const cacheDoc = await db.doc(cachePath).get();
      if (cacheDoc.exists) {
        const cached = cacheDoc.data();
        const age = Date.now() - (cached.fetchedAt ? cached.fetchedAt.toMillis() : 0);
        if (age < WEATHER_CACHE_TTL_MS && cached.forecast) {
          return Object.assign({ unavailable: false }, cached.forecast);
        }
      }
    } catch (e) {
      console.warn("讀取天氣快取失敗:", e);
    }
  }

  const targetDate = new Date(date + "T00:00:00");
  const daysAhead = Math.floor((targetDate - new Date(new Date().toDateString())) / (24 * 60 * 60 * 1000));
  if (daysAhead < 0 || daysAhead > 5) {
    return { unavailable: true, reason: "out-of-range" };
  }

  let forecast;
  try {
    const url =
      "https://api.openweathermap.org/data/2.5/forecast?lat=" +
      lat +
      "&lon=" +
      lng +
      "&units=metric&appid=" +
      encodeURIComponent(CONFIG.openWeatherApiKey);
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();

    const dayEntries = json.list.filter(function (entry) {
      return entry.dt_txt.startsWith(date);
    });
    if (dayEntries.length === 0) {
      return { unavailable: true, reason: "no-data" };
    }

    let tempHigh = -Infinity;
    let tempLow = Infinity;
    dayEntries.forEach(function (entry) {
      tempHigh = Math.max(tempHigh, entry.main.temp_max);
      tempLow = Math.min(tempLow, entry.main.temp_min);
    });
    const midday =
      dayEntries.find(function (entry) {
        return entry.dt_txt.includes("12:00:00");
      }) || dayEntries[Math.floor(dayEntries.length / 2)];

    forecast = {
      tempHigh: Math.round(tempHigh),
      tempLow: Math.round(tempLow),
      condition: midday.weather[0].description,
      icon: midday.weather[0].icon,
      summary: json.city.name,
    };
  } catch (e) {
    console.error("取得天氣失敗:", e);
    return { unavailable: true, reason: "fetch-error" };
  }

  if (firebaseEnabled) {
    db.doc(cachePath)
      .set({
        lat: lat,
        lng: lng,
        fetchedAt: firebase.firestore.Timestamp.now(),
        forecast: forecast,
      })
      .catch(function (e) {
        console.warn("寫入天氣快取失敗:", e);
      });
  }

  return Object.assign({ unavailable: false }, forecast);
}
