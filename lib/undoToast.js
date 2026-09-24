// 「刪除後幾秒內可復原」的全站提示 —— 全部刪除動作改成「軟刪除」（標記 deletedAt，不是真的移除），
// 這樣 5 秒的復原視窗結束後資料也還留著，不會真的救不回來，只是介面上不再顯示。
const undoToastListeners = [];
let currentToast = null;

function showUndoToast(message, onUndo) {
  const toast = { id: generateId(8), message: message, onUndo: onUndo };
  currentToast = toast;
  undoToastListeners.slice().forEach(function (fn) { fn(currentToast); });

  setTimeout(function () {
    if (currentToast && currentToast.id === toast.id) {
      currentToast = null;
      undoToastListeners.slice().forEach(function (fn) { fn(null); });
    }
  }, 5000);
}

function dismissUndoToast() {
  currentToast = null;
  undoToastListeners.slice().forEach(function (fn) { fn(null); });
}
