// 票券保管箱的分類清單（V1），順序就是畫面上顯示的順序
const VAULT_CATEGORIES = [
  { key: "flight", label: "機票", icon: "✈️" },
  { key: "stay", label: "住宿", icon: "🏨" },
  { key: "ticket", label: "門票與預約", icon: "🎫" },
  { key: "transit", label: "交通券", icon: "🚄" },
  { key: "esim", label: "eSIM", icon: "📶" },
  { key: "entry", label: "入境資料", icon: "🛂" },
  { key: "insurance", label: "保險", icon: "🛡️" },
  { key: "other", label: "其他", icon: "📄" },
];

function vaultCategoryLabel(key) {
  const found = VAULT_CATEGORIES.filter(function (c) { return c.key === key; })[0];
  return found ? found.label : "其他";
}

function vaultCategoryIcon(key) {
  const found = VAULT_CATEGORIES.filter(function (c) { return c.key === key; })[0];
  return found ? found.icon : "📄";
}
