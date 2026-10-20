function useOnlineStatus() {
  const [online, setOnline] = React.useState(navigator.onLine);
  const wasOffline = React.useRef(!navigator.onLine);

  React.useEffect(function () {
    function goOnline() {
      setOnline(true);
      // 從離線恢復連線：等本機離線時累積的寫入都送出去之後，提示一下，使用者會比較安心
      if (wasOffline.current && usingRealFirebase) {
        db.waitForPendingWrites()
          .then(function () { showUndoToast("✅ 已重新連線，資料同步完成"); })
          .catch(function () {});
      }
      wasOffline.current = false;
    }
    function goOffline() {
      setOnline(false);
      wasOffline.current = true;
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return function () {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}

// 給離線提示條用：「上次同步的資料」是幾點幾分的，而不是只講「上次」兩個字含糊帶過
function useLastSyncedAt() {
  const [ts, setTs] = React.useState(function () { return getLastSyncedAt(); });

  React.useEffect(function () {
    return subscribeSyncStatus(setTs);
  }, []);

  return ts;
}
