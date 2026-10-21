// 全站共用的「上次成功跟伺服器同步的時間」，給離線提示用（O4）。
// 任何一個 useCollection/useDocument 只要收到「不是從本機快取來的」(metadata.fromCache === false)
// 回應，就代表確實連上了伺服器，順手呼叫 recordSync() 更新這個時間戳記。
let lastSyncedAt = null;
const syncListeners = [];

function recordSync() {
  lastSyncedAt = Date.now();
  try { localStorage.setItem("zoula_last_synced_at", String(lastSyncedAt)); } catch (e) {}
  syncListeners.slice().forEach(function (fn) { fn(lastSyncedAt); });
}

function getLastSyncedAt() {
  if (lastSyncedAt) return lastSyncedAt;
  try {
    const stored = localStorage.getItem("zoula_last_synced_at");
    if (stored) { lastSyncedAt = Number(stored); return lastSyncedAt; }
  } catch (e) {}
  return null;
}

function subscribeSyncStatus(fn) {
  syncListeners.push(fn);
  return function () {
    const idx = syncListeners.indexOf(fn);
    if (idx >= 0) syncListeners.splice(idx, 1);
  };
}

function formatSyncedTime(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// O6：離線時新增/修改的內容，Firestore 本身就會存在本機、恢復連線後自動送出（不用自己寫同步邏輯），
// 這裡只負責「畫面上要不要顯示『還有變更在同步中』」——每個 useCollection 回報自己這個 collection
// 目前還有沒有本機尚未送達伺服器的寫入（snapshot.metadata.hasPendingWrites），有幾個 collection
// 回報「還有」，就顯示幾筆（不是真的算出精確的文件筆數，是「幾個清單還在同步」的近似值，
// 但對使用者來說「還在同步中」比精確數字更重要）。
const pendingPaths = {};
const pendingListeners = [];

function setPendingWrites(path, hasPending) {
  const had = Boolean(pendingPaths[path]);
  if (hasPending) pendingPaths[path] = true; else delete pendingPaths[path];
  if (had !== hasPending) {
    const count = Object.keys(pendingPaths).length;
    pendingListeners.slice().forEach(function (fn) { fn(count); });
  }
}

function getPendingCount() {
  return Object.keys(pendingPaths).length;
}

function subscribePendingCount(fn) {
  pendingListeners.push(fn);
  return function () {
    const idx = pendingListeners.indexOf(fn);
    if (idx >= 0) pendingListeners.splice(idx, 1);
  };
}
