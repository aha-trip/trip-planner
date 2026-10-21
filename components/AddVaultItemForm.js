// 新增票券保管箱項目：照片選填（有些憑證只需要記預約編號，不一定有截圖），
// 分享範圍沿用跟購物清單一樣的 ShareScopePicker（全團/指定成員/只有我）。
function AddVaultItemForm({ tripId, nickname, wishlistItems, onDone, onCancel }) {
  const [category, setCategory] = React.useState("ticket");
  const [title, setTitle] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [confirmationCode, setConfirmationCode] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [linkedId, setLinkedId] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [shareMode, setShareMode] = React.useState("everyone");
  const [selectedMembers, setSelectedMembers] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(function () {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return function () { URL.revokeObjectURL(url); };
  }, [file]);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
    e.target.value = "";
  }

  async function handleNativeCamera() {
    try {
      const photo = await window.Capacitor.Plugins.Camera.getPhoto({ quality: 85, resultType: "dataUrl", source: "CAMERA" });
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const ext = (photo.format || "jpeg").replace("jpg", "jpeg");
      setFile(new File([blob], "camera." + ext, { type: "image/" + ext }));
    } catch (err) {
      // 使用者取消拍照，安靜結束
    }
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
    if (!title.trim()) { setError("請填標題，例如「東京→大阪 新幹線」"); return; }
    if (shareMode === "specific" && selectedMembers.length === 0) {
      setError("請至少選一位要分享的對象，或改選其他分享範圍");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const photo = file ? await compressImage(file) : null;
      const fields = {
        category: category,
        title: title.trim(),
        startsAt: startsAt || null,
        confirmationCode: confirmationCode.trim(),
        notes: notes.trim(),
        linkedWishlistItemId: linkedId || null,
        addedBy: nickname || "匿名",
      };

      if (shareMode === "private") {
        await addPrivateVaultItem(tripId, photo, fields);
      } else {
        let imageUrl = null;
        let imagePath = null;
        if (photo) {
          const safeName = (photo.name || "vault.jpg").replace(/[^\w.\-]/g, "_");
          const path = "trips/" + tripId + "/vault/" + generateId(12) + "-" + safeName;
          const ref = storage.ref(path);
          await ref.put(photo);
          imageUrl = await ref.getDownloadURL();
          imagePath = path;
        }
        await db.collection("trips/" + tripId + "/vaultItems").add(Object.assign(
          { imageUrl: imageUrl, imagePath: imagePath, visibleTo: shareMode === "specific" ? selectedMembers : null, createdAt: firebase.firestore.Timestamp.now() },
          fields
        ));
      }
      if (onDone) onDone();
    } catch (err) {
      console.error(err);
      const detail = err && (err.message || err.code);
      setError("新增失敗" + (detail ? "：" + detail : "，請稍後再試。"));
    } finally {
      setSaving(false);
    }
  }

  const fileInputId = "vault-file-input";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-xl border border-amber-100 p-4">
      <div className="flex flex-wrap gap-1.5">
        {VAULT_CATEGORIES.map(function (c) {
          const Icon = vaultCategoryIconComponent(c.key);
          return (
            <button
              type="button"
              key={c.key}
              onClick={function () { setCategory(c.key); }}
              className={
                "px-2.5 py-1 rounded-full text-xs font-medium border transition inline-flex items-center gap-1 " +
                (category === c.key ? "bg-brand-600 border-brand-600 text-white" : "border-amber-200 text-slate-600 hover:border-brand-400")
              }
            >
              <Icon className="w-3 h-3" /> {c.label}
            </button>
          );
        })}
      </div>

      <input
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="標題，例如：東京→大阪 新幹線 / 高嶺旅店 2晚"
        value={title}
        onChange={function (e) { setTitle(e.target.value); }}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">日期時間（選填）</label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
            value={startsAt}
            onChange={function (e) { setStartsAt(e.target.value); }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">預約編號（選填）</label>
          <input
            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
            value={confirmationCode}
            onChange={function (e) { setConfirmationCode(e.target.value); }}
          />
        </div>
      </div>

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
          {window.Capacitor && window.Capacitor.isNativePlatform() && (
            <button type="button" onClick={handleNativeCamera} className="w-full min-h-[44px] rounded-lg border-2 border-brand-600 text-white font-medium bg-brand-600 active:bg-brand-700 text-sm inline-flex items-center justify-center gap-1.5">
              <CameraIcon className="w-4 h-4" /> 拍照
            </button>
          )}
          <button type="button" onClick={function () { document.getElementById(fileInputId).click(); }} className="w-full min-h-[44px] rounded-lg border-2 border-brand-400 text-brand-700 font-medium bg-brand-50 active:bg-brand-100 text-sm inline-flex items-center justify-center gap-1.5">
            <FolderIcon className="w-4 h-4" /> 從相簿選擇憑證照片（選填）
          </button>
          <textarea
            value=""
            onChange={function () {}}
            onPaste={handlePaste}
            placeholder="或在這裡貼上截圖（電腦 Ctrl+V／手機長按選「貼上」）"
            className="w-full h-12 resize-none border-2 border-dashed border-amber-200 rounded-lg p-2 text-center text-xs text-slate-500 focus:outline-none focus:border-brand-400"
          />
          <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      <textarea
        className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
        rows={2}
        placeholder="備註（選填）"
        value={notes}
        onChange={function (e) { setNotes(e.target.value); }}
      />

      {wishlistItems && wishlistItems.length > 0 && (
        <React.Fragment>
          <button
            type="button"
            onClick={function () { setPickerOpen(true); }}
            className="w-full min-h-[40px] rounded-lg border border-amber-200 px-3 text-left text-sm bg-white flex items-center justify-between gap-2"
          >
            <span className={"truncate " + (linkedId ? "text-slate-800" : "text-slate-500")}>
              {linkedId
                ? (wishlistItems.filter(function (w) { return w.id === linkedId; })[0] || { name: "（已刪除的地點）" }).name
                : "連結行程地點（選填）"}
            </span>
            <span className="text-slate-400 shrink-0">›</span>
          </button>
          {pickerOpen && (
            <WishlistPicker items={wishlistItems} value={linkedId} onPick={function (id) { setLinkedId(id); setPickerOpen(false); }} onClose={function () { setPickerOpen(false); }} />
          )}
        </React.Fragment>
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

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-amber-200 text-slate-600 text-sm font-medium py-2.5">取消</button>
        <button type="submit" disabled={saving} className="flex-[2] min-h-[44px] rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium transition text-sm">
          {saving ? "新增中..." : "新增到保管箱"}
        </button>
      </div>
    </form>
  );
}
