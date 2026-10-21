// 票券保管箱的分類清單（V1），順序就是畫面上顯示的順序。
// 圖示對照表故意放在 components/Icons.js（見 vaultCategoryIconComponent），不是放這裡：
// 這個檔案是「平常 script」，載入順序在 Icons.js 這個 Babel 元件之前，如果在這裡直接寫
// `icon: PlaneIcon` 這種參照，本機開發模式（一支一支載入，沒打包）會因為 PlaneIcon 還沒定義
// 而噴錯。改成「要用的時候才查表」（函式呼叫時才解析），就不受載入順序影響。
const VAULT_CATEGORIES = [
  { key: "flight", label: "機票" },
  { key: "stay", label: "住宿" },
  { key: "ticket", label: "門票與預約" },
  { key: "transit", label: "交通券" },
  { key: "esim", label: "eSIM" },
  { key: "entry", label: "入境資料" },
  { key: "insurance", label: "保險" },
  { key: "other", label: "其他" },
];

function vaultCategoryLabel(key) {
  const found = VAULT_CATEGORIES.filter(function (c) { return c.key === key; })[0];
  return found ? found.label : "其他";
}
