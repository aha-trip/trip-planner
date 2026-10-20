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
