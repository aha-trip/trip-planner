const CATEGORY_OPTIONS = ["sight", "food", "activity", "shopping", "other"];

function AddWishlistItemForm({ tripId, nickname }) {
  const inputRef = React.useRef(null);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [coords, setCoords] = React.useState({ lat: null, lng: null, placeId: null });
  const [category, setCategory] = React.useState("sight");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [placesActive, setPlacesActive] = React.useState(Boolean(CONFIG.googleMapsApiKey));

  React.useEffect(function () {
    if (!CONFIG.googleMapsApiKey || !inputRef.current) return;
    const cleanup = attachPlacesAutocomplete(inputRef.current, function (place) {
      setName(place.name);
      setAddress(place.address);
      setCoords({ lat: place.lat, lng: place.lng, placeId: place.placeId });
    });
    return cleanup;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await db.collection("trips/" + tripId + "/wishlistItems").add({
        name: name.trim(),
        category: category,
        address: address.trim(),
        lat: coords.lat,
        lng: coords.lng,
        placeId: coords.placeId,
        photoUrl: null,
        notes: notes.trim(),
        addedBy: nickname || "匿名",
        createdAt: firebase.firestore.Timestamp.now(),
      });
      setName("");
      setAddress("");
      setCoords({ lat: null, lng: null, placeId: null });
      setNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-amber-100 p-4 space-y-3">
      <input
        ref={inputRef}
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder={placesActive ? "搜尋地點名稱..." : "地點名稱"}
        value={name}
        onChange={function (e) {
          setName(e.target.value);
          setCoords({ lat: null, lng: null, placeId: null });
        }}
      />

      {!placesActive && (
        <input
          className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="地址（選填，沒有 Google Maps 金鑰時手動輸入）"
          value={address}
          onChange={function (e) { setAddress(e.target.value); }}
        />
      )}
      {placesActive && address && <p className="text-xs text-slate-400 px-1">{address}</p>}

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_OPTIONS.map(function (c) {
          return (
            <button
              type="button"
              key={c}
              onClick={function () { setCategory(c); }}
              className={
                "px-2.5 py-1 rounded-full text-xs font-medium border transition " +
                (category === c ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
              }
            >
              {CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>

      <textarea
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="備註（選填）"
        rows={2}
        value={notes}
        onChange={function (e) { setNotes(e.target.value); }}
      />

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 transition"
      >
        {saving ? "新增中..." : "加入願望清單"}
      </button>
    </form>
  );
}
