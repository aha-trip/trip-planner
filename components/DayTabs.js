function DayTabs({ tripId, dayList, activeDate, onSelect, dayLocations }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {dayList.map(function (date, index) {
        const isActive = date === activeDate;
        const loc = (dayLocations && dayLocations[date]) || {};
        return (
          <button
            key={date}
            onClick={function () { onSelect(date); }}
            className={
              "shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center " +
              (isActive ? "bg-brand-600 text-white" : "bg-white border border-amber-100 text-slate-600 hover:border-brand-400")
            }
          >
            Day {index + 1} · {date.slice(5)}
            <DayTabWeather tripId={tripId} date={date} lat={loc.lat} lng={loc.lng} />
          </button>
        );
      })}
    </div>
  );
}
