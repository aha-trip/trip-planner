const CATEGORY_OPTIONS = ["sight", "food", "activity", "shopping", "other"];

function AddWishlistItemForm({ tripId, nickname, onCreated, submitLabel }) {
  const inputRef = React.useRef(null);
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [coords, setCoords] = React.useState({ lat: null, lng: null, placeId: null });
  const [category, setCategory] = React.useState("sight");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [placesActive, setPlacesActive] = React.useState(Boolean(CONFIG.googleMapsApiKey));
  const online = useOnlineStatus();
  // 直接貼在地點名稱欄位裡就會自動偵測、解析，不要另外弄一個欄位要人多打一次字——
  // 從 Google 地圖複製連結，就是為了貼這裡，不是為了貼到另一個專門的連結框裡。
  const [mapsUrlStatus, setMapsUrlStatus] = React.useState(null); // null | "loading" | "shortlink" | "failed"
  const [lastShortUrl, setLastShortUrl] = React.useState("");

  async function handleNameInputPaste(e) {
    const pasted = ((e.clipboardData && e.clipboardData.getData("text")) || "").trim();
    if (!/^https?:\/\//i.test(pasted) || !parseGoogleMapsUrl(pasted)) return; // 不是 Google 地圖連結，當一般文字正常貼上
    e.preventDefault();
    setName("");
    setAddress("");
    setCoords({ lat: null, lng: null, placeId: null });
    setMapsUrlStatus("loading");
    const result = await resolveGoogleMapsUrl(pasted);
    if (!result.ok) {
      if (result.reason === "shortlink") {
        // maps.app.goo.gl 這種縮短連結沒辦法直接解析（瀏覽器安全限制擋著，詳見 lib/googleMapsImport.js），
        // 直接幫他開一次連結省一個步驟，使用者只要在新分頁複製變完整後的網址、回來貼同一個欄位就好，
        // 不用自己找連結點、也不用切到另一個框填。
        window.open(pasted, "_blank");
        setLastShortUrl(pasted);
        setMapsUrlStatus("shortlink");
      } else {
        setMapsUrlStatus("failed");
      }
      return;
    }
    setName(result.name || "");
    setAddress(result.address || "");
    setCoords({ lat: result.lat, lng: result.lng, placeId: result.placeId });
    setMapsUrlStatus(null);
  }

  React.useEffect(function () {
    if (!CONFIG.googleMapsApiKey || !inputRef.current || !online) return;
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
      const docRef = await db.collection("trips/" + tripId + "/wishlistItems").add({
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
      if (onCreated) await onCreated(docRef.id);
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
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-amber-50/50"
        placeholder={placesActive && online ? "搜尋地點名稱，或直接貼上 Google 地圖連結" : "地點名稱"}
        value={name}
        disabled={mapsUrlStatus === "loading"}
        onPaste={handleNameInputPaste}
        onChange={function (e) {
          setName(e.target.value);
          setCoords({ lat: null, lng: null, placeId: null });
          setMapsUrlStatus(null);
        }}
      />

      {mapsUrlStatus === "loading" && (
        <p className="text-xs text-slate-400 px-1">正在解析 Google 地圖連結...</p>
      )}
      {mapsUrlStatus === "shortlink" && (
        <p className="text-xs text-amber-800 px-1">
          這是縮短過的連結，已經幫你開新分頁了——在那邊網址列變成完整的 google.com/maps/... 之後，複製那個網址再貼回剛剛的欄位一次就好。
          （如果沒跳出新分頁：<a href={lastShortUrl} target="_blank" rel="noopener noreferrer" className="underline">點這裡開啟</a>）
        </p>
      )}
      {mapsUrlStatus === "failed" && (
        <p className="text-xs text-red-600 px-1">這個 Google 地圖連結解析不出內容，可以改手動輸入名稱。</p>
      )}

      {!placesActive && (
        <input
          className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="地址（選填，沒有 Google Maps 金鑰時手動輸入）"
          value={address}
          onChange={function (e) { setAddress(e.target.value); }}
        />
      )}
      {placesActive && !online && (
        <p className="text-xs text-slate-400 px-1 flex items-center gap-1"><OfflineIcon className="w-3.5 h-3.5 shrink-0" /> 離線中，先手動輸入名稱就好，連上網路後可以搜尋地點</p>
      )}
      {placesActive && online && address && <p className="text-xs text-slate-400 px-1">{address}</p>}

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
        {saving ? "新增中..." : (submitLabel || "加入願望清單")}
      </button>
    </form>
  );
}
