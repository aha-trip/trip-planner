function DayColumn({ tripId, date, itineraryItems, wishlistById, trip, nickname }) {
  const sorted = React.useMemo(function () {
    return itineraryItems
      .filter(function (i) { return i.date === date; })
      .slice()
      .sort(function (a, b) { return a.order - b.order; });
  }, [itineraryItems, date]);

  const [computing, setComputing] = React.useState(false);

  const signature = sorted
    .map(function (i) {
      const manualTime = i.travelTimeSource === "manual" ? i.travelTimeMinutes : "";
      return [i.id, i.order, i.transportMode, i.durationMinutes, i.travelTimeSource, manualTime].join(":");
    })
    .join("|") + "||first-arrival:" + (sorted[0] ? sorted[0].arrivalTime : "");

  React.useEffect(function () {
    if (sorted.length === 0) return;
    let cancelled = false;

    async function recalc() {
      setComputing(true);
      let prevDeparture = null;

      for (let i = 0; i < sorted.length; i++) {
        if (cancelled) return;
        const curr = sorted[i];
        const currLoc = wishlistById[curr.wishlistItemId];
        const updates = {};

        if (i === 0) {
          const arrival = curr.arrivalTime || "09:00";
          const departure = addMinutesToTime(arrival, curr.durationMinutes || 0);
          if (curr.arrivalTime !== arrival) updates.arrivalTime = arrival;
          if (curr.departureTime !== departure) updates.departureTime = departure;
          prevDeparture = departure;
        } else {
          const prev = sorted[i - 1];
          const prevLoc = wishlistById[prev.wishlistItemId];
          let travelMinutes = curr.travelTimeMinutes;
          let travelMeters = curr.travelDistanceMeters;

          if (curr.travelTimeSource !== "manual" && prevLoc && currLoc) {
            const result = await calculateTravelTime(prevLoc, currLoc, curr.transportMode);
            if (result) {
              travelMinutes = result.minutes;
              travelMeters = result.meters;
            }
          }

          const arrival = addMinutesToTime(prevDeparture, travelMinutes || 0);
          const departure = addMinutesToTime(arrival, curr.durationMinutes || 0);

          if (travelMinutes !== curr.travelTimeMinutes) updates.travelTimeMinutes = travelMinutes;
          if (travelMeters !== curr.travelDistanceMeters) updates.travelDistanceMeters = travelMeters;
          if (arrival !== curr.arrivalTime) updates.arrivalTime = arrival;
          if (departure !== curr.departureTime) updates.departureTime = departure;
          prevDeparture = departure;
        }

        if (Object.keys(updates).length > 0 && !cancelled) {
          await db.doc("trips/" + tripId + "/itineraryItems/" + curr.id).update(updates);
        }
      }
      if (!cancelled) setComputing(false);
    }

    recalc();
    return function () { cancelled = true; };
    // eslint-disable-next-line
  }, [signature]);

  async function handleMove(index, direction) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[otherIndex];
    const batch = db.batch();
    batch.update(db.doc("trips/" + tripId + "/itineraryItems/" + a.id), { order: b.order });
    batch.update(db.doc("trips/" + tripId + "/itineraryItems/" + b.id), { order: a.order });
    await batch.commit();
  }

  const firstLoc = sorted.length > 0 ? wishlistById[sorted[0].wishlistItemId] : null;
  const dayLat = (firstLoc && firstLoc.lat) != null ? firstLoc.lat : trip.lat;
  const dayLng = (firstLoc && firstLoc.lng) != null ? firstLoc.lng : trip.lng;

  return (
    <div className="space-y-1">
      <DayWeatherBanner tripId={tripId} date={date} lat={dayLat} lng={dayLng} />

      {sorted.length === 0 && (
        <p className="text-slate-400 text-sm py-6 text-center">這天還沒有安排行程，從願望清單加入吧！</p>
      )}

      {sorted.map(function (item, index) {
        return (
          <div key={item.id}>
            {index > 0 && <TravelSegment tripId={tripId} item={item} computing={computing} />}
            <ItineraryItemCard
              tripId={tripId}
              item={item}
              wishlistItem={wishlistById[item.wishlistItemId]}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
              onMoveUp={function () { handleMove(index, -1); }}
              onMoveDown={function () { handleMove(index, 1); }}
              nickname={nickname}
            />
          </div>
        );
      })}
    </div>
  );
}
