// 顯示在行程分頁標籤上的迷你天氣（只顯示圖示+氣溫，沒有資料就什麼都不顯示，避免每個分頁都塞滿提示文字）
function DayTabWeather({ tripId, date, lat, lng }) {
  const [weather, setWeather] = React.useState(null);

  React.useEffect(function () {
    let cancelled = false;
    getWeatherForDay(tripId, date, lat, lng).then(function (result) {
      if (!cancelled) setWeather(result);
    });
    return function () { cancelled = true; };
  }, [tripId, date, lat, lng]);

  if (!weather || weather.unavailable) return null;

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <img src={weatherIconUrl(weather.icon)} alt="" className="w-4 h-4" />
      <span>{weather.tempHigh}°</span>
    </span>
  );
}
