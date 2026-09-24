// 新增購物清單項目：可以選檔案，也可以直接 Ctrl+V 貼上截圖，並選擇要分享給所有人、指定對象、還是只有自己看得到
function AddShoppingItemForm({ tripId, nickname, linkedWishlistItemId, wishlistItems, onDone }) {
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [caption, setCaption] = React.useState("");
  const [linkedId, setLinkedId] = React.useState(linkedWishlistItemId || "");
  const [shareMode, setShareMode] = React.useState("everyone"); // 'everyone' | 'specific' | 'private'
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const { data: members } = useCollection("trips/" + tripId + "/members");
  const otherMembers = members.filter(function (m) { return m.nickname !== nickname; });

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

  function toggleMember(name) {
    setSelectedMembers(function (prev) {
      return prev.indexOf(name) >= 0 ? prev.filter(function (n) { return n !== name; }) : prev.concat([name]);
    });
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
      if (shareMode === "private") {
        await addPrivateShoppingItem(tripId, file, {
          caption: caption.trim(),
          linkedWishlistItemId: linkedId || null,
          addedBy: nickname || "匿名",
        });
      } else {
        const path = "trips/" + tripId + "/shopping/" + generateId(12) + "-" + file.name;
        const ref = storage.ref(path);
        await ref.put(file);
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
      setError("新增失敗，請稍後再試。");
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
          <textarea
            value=""
            onChange={function () {}}
            onPaste={handlePaste}
            placeholder="點這裡，然後貼上 (Ctrl+V) 截圖　手機請長按此處選「貼上」"
            className="w-full h-16 resize-none border-2 border-dashed border-amber-200 rounded-lg p-2 text-center text-xs text-slate-500 focus:outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={function () { document.getElementById(fileInputId).click(); }}
            className="w-full text-xs text-brand-600 hover:underline py-1"
          >
            📁 或從相簿選擇圖片
          </button>
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
        <select
          className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={linkedId}
          onChange={function (e) { setLinkedId(e.target.value); }}
        >
          <option value="">不連結地點</option>
          {wishlistItems.map(function (w) {
            return <option key={w.id} value={w.id}>{w.name}</option>;
          })}
        </select>
      )}

      <div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={function () { setShareMode("everyone"); }}
            className={
              "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition " +
              (shareMode === "everyone" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
            }
          >
            <GlobeIcon className="w-3.5 h-3.5" /> 所有人
          </button>
          <button
            type="button"
            onClick={function () { setShareMode("specific"); }}
            className={
              "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition " +
              (shareMode === "specific" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
            }
          >
            <PeopleIcon className="w-3.5 h-3.5" /> 指定對象
          </button>
          <button
            type="button"
            onClick={function () { setShareMode("private"); }}
            className={
              "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition " +
              (shareMode === "private" ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
            }
          >
            <LockIcon className="w-3.5 h-3.5" /> 只有我
          </button>
        </div>

        {shareMode === "specific" && (
          <div className="mt-2 p-2 rounded-lg bg-cream border border-amber-100">
            {otherMembers.length === 0 ? (
              <p className="text-xs text-slate-400">還沒有其他成員的資料，等他們打開這個行程連結、設定暱稱後就會出現在這裡。</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {otherMembers.map(function (m) {
                  const checked = selectedMembers.indexOf(m.nickname) >= 0;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={function () { toggleMember(m.nickname); }}
                      className={
                        "px-2.5 py-1 rounded-full text-xs font-medium border transition " +
                        (checked ? "bg-brand-500 border-brand-500 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
                      }
                    >
                      {checked ? "✓ " : ""}{m.nickname}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1.5">
              提醒：這個 App 沒有帳號登入，「指定對象」是依暱稱過濾畫面顯示，不是真正加密隔離。
            </p>
          </div>
        )}
        {shareMode === "private" && (
          <p className="text-xs text-slate-400 mt-1.5">這個只會存在你這個瀏覽器，不會同步給其他行程成員。</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium py-2 transition"
      >
        {uploading ? "新增中..." : "新增到購物清單"}
      </button>
    </form>
  );
}
