// 新增購物清單項目：可以選檔案，也可以直接 Ctrl+V 貼上截圖，並選擇要分享給所有人、指定對象、還是只有自己看得到
function AddShoppingItemForm({ tripId, nickname, linkedWishlistItemId, wishlistItems, onDone }) {
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [caption, setCaption] = React.useState("");
  const [linkedId, setLinkedId] = React.useState(linkedWishlistItemId || "");
  const [shareMode, setShareMode] = React.useState("everyone"); // 'everyone' | 'specific' | 'private'
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [error, setError] = React.useState(null);


  React.useEffect(function () {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return function () { URL.revokeObjectURL(url); };
  }, [file]);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
    e.target.value = ""; // 讓同一張照片移除後還能再選一次
  }

  function handlePaste(e) {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) {
        setFile(items[i].getAsFile());
        e.preventDefault();
        break;
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("請選擇或貼上一張截圖");
      return;
    }
    if (shareMode === "specific" && selectedMembers.length === 0) {
      setError("請至少選一位要分享的對象，或改選其他分享範圍");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // 手機相簿的照片常常很大，先縮圖再上傳/儲存，不然容易超過上傳大小上限或本機儲存空間
      const photo = await compressImage(file);
      if (shareMode === "private") {
        await addPrivateShoppingItem(tripId, photo, {
          caption: caption.trim(),
          linkedWishlistItemId: linkedId || null,
          addedBy: nickname || "匿名",
        });
      } else {
        const safeName = (photo.name || "photo.jpg").replace(/[^\w.\-]/g, "_");
        const path = "trips/" + tripId + "/shopping/" + generateId(12) + "-" + safeName;
        const ref = storage.ref(path);
        await ref.put(photo);
        const imageUrl = await ref.getDownloadURL();

        await db.collection("trips/" + tripId + "/shoppingItems").add({
          imageUrl: imageUrl,
          imagePath: path,
          caption: caption.trim(),
          linkedWishlistItemId: linkedId || null,
          addedBy: nickname || "匿名",
          visibleTo: shareMode === "specific" ? selectedMembers : null,
          createdAt: firebase.firestore.Timestamp.now(),
        });
      }

      setFile(null);
      setCaption("");
      setSelectedMembers([]);
      if (!linkedWishlistItemId) setLinkedId("");
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      const detail = err && (err.message || err.code);
      setError("新增失敗" + (detail ? "：" + detail : "，請稍後再試。"));
    } finally {
      setUploading(false);
    }
  }

  const fileInputId = "shopping-file-input-" + (linkedWishlistItemId || "global");

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-xl border border-amber-100 p-4">
      {previewUrl ? (
        <div className="relative">
          <img src={previewUrl} alt="預覽" className="max-h-40 mx-auto rounded-lg" />
          <button
            type="button"
            onClick={function () { setFile(null); }}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-slate-900/60 text-white text-sm"
            aria-label="移除，重新選擇"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={function () { document.getElementById(fileInputId).click(); }}
            className="w-full min-h-[48px] rounded-lg border-2 border-brand-400 text-brand-700 font-medium bg-brand-50 active:bg-brand-100"
          >
            📁 從相簿選擇圖片
          </button>
          <textarea
            value=""
            onChange={function () {}}
            onPaste={handlePaste}
            placeholder="或在這裡貼上截圖（電腦 Ctrl+V／手機長按選「貼上」）"
            className="w-full h-16 resize-none border-2 border-dashed border-amber-200 rounded-lg p-2 text-center text-xs text-slate-500 focus:outline-none focus:border-brand-400"
          />
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      <input
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="備註（例如：想買的顏色/尺寸）"
        value={caption}
        onChange={function (e) { setCaption(e.target.value); }}
      />

      {!linkedWishlistItemId && wishlistItems && wishlistItems.length > 0 && (
        <>
          <button
            type="button"
            onClick={function () { setPickerOpen(true); }}
            className="w-full min-h-[44px] rounded-lg border border-amber-200 px-3 text-left text-sm bg-white flex items-center justify-between gap-2"
          >
            <span className={"truncate " + (linkedId ? "text-slate-800" : "text-slate-500")}>
              {linkedId
                ? (wishlistItems.filter(function (w) { return w.id === linkedId; })[0] || { name: "（已刪除的地點）" }).name
                : "連結地點（選填，可搜尋）"}
            </span>
            <span className="text-slate-400 shrink-0">›</span>
          </button>
          {pickerOpen && (
            <WishlistPicker
              items={wishlistItems}
              value={linkedId}
              onPick={function (id) { setLinkedId(id); setPickerOpen(false); }}
              onClose={function () { setPickerOpen(false); }}
            />
          )}
        </>
      )}

      <ShareScopePicker
        tripId={tripId}
        nickname={nickname}
        mode={shareMode}
        onModeChange={setShareMode}
        selectedMembers={selectedMembers}
        onMembersChange={setSelectedMembers}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full min-h-[48px] rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium transition"
      >
        {uploading ? "新增中..." : "新增到購物清單"}
      </button>
    </form>
  );
}
