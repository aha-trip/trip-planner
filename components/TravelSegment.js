const TRANSPORT_ICONS = { walk: "🚶", drive: "🚗", taxi: "🚕", transit: "🚆", bike: "🚴" };

function TravelSegment({ tripId, item, computing }) {
  async function updateField(fields) {
    await db.doc("trips/" + tripId + "/itineraryItems/" + item.id).update(fields);
  }

  function handleModeChange(e) {
    updateField({ transportMode: e.target.value });
  }

  function handleManualTimeChange(e) {
    const minutes = parseInt(e.target.value, 10);
    updateField({
      travelTimeMinutes: isNaN(minutes) ? null : minutes,
      travelTimeSource: "manual",
    });
  }

  function resetToAuto() {
    updateField({ travelTimeSource: "auto" });
  }

  return (
    <div className="flex items-center gap-2 pl-4 py-1.5 text-sm text-slate-500">
      <div className="w-px h-6 bg-slate-200 ml-2" />
      <select
        value={item.transportMode}
        onChange={handleModeChange}
        className="text-sm rounded-lg border border-amber-100 px-1.5 py-1 bg-slate-50"
      >
        {Object.keys(TRANSPORT_LABELS).map(function (mode) {
          return (
            <option key={mode} value={mode}>
              {TRANSPORT_ICONS[mode]} {TRANSPORT_LABELS[mode]}
            </option>
          );
        })}
      </select>

      <input
        type="number"
        min="0"
        className="w-16 rounded-lg border border-amber-100 px-2 py-1 text-sm"
        value={item.travelTimeMinutes != null ? item.travelTimeMinutes : ""}
        placeholder={computing ? "..." : "-"}
        onChange={handleManualTimeChange}
      />
      <span>分鐘</span>

      {item.travelTimeSource === "manual" ? (
        <button onClick={resetToAuto} className="text-xs text-brand-600 hover:underline">
          改回自動計算
        </button>
      ) : (
        <span className="text-xs text-slate-400">自動計算</span>
      )}
    </div>
  );
}
