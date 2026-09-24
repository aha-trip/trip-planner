function DayWeatherBanner({ tripId, date, lat, lng }) {
  const [weather, setWeather] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(function () {
    let cancelled = false;
    setLoading(true);
    getWeatherForDay(tripId, date, lat, lng).then(function (result) {
      if (!cancelled) {
        setWeather(result);
        setLoading(false);
      }
    });
    return function () { cancelled = true; };
  }, [tripId, date, lat, lng]);

  if (loading) {
    return <div className="text-xs text-slate-400 px-1">天氣載入中...</div>;
  }

  if (!weather || weather.unavailable) {
    const reasonText = {
      "no-api-key": "尚未設定天氣 API 金鑰",
      "no-location": "這天還沒有地點座標，無法查天氣",
      "out-of-range": "超過預報範圍（只能看未來 5 天）",
      "no-data": "查無天氣資料",
      "fetch-error": "天氣資料讀取失敗",
    };
    return (
      <div className="text-xs text-slate-400 px-1">
        🌤️ {(weather && reasonText[weather.reason]) || "天氣資訊暫不可用"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1 text-sm text-slate-600">
      <img src={weatherIconUrl(weather.icon)} alt={weather.condition} className="w-8 h-8" />
      <span>{weather.condition}</span>
      <span className="font-medium">{weather.tempLow}° - {weather.tempHigh}°C</span>
    </div>
  );
}
