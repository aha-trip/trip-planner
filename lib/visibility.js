// 「指定對象分享」用的小工具。
//
// 注意：這種分享資料還是寫進大家共用的資料庫（Firestore/本機共用資料庫），只是每個人的畫面
// 會依照 visibleTo 名單過濾要不要顯示——是「畫面上不給你看」，不是真的從資料庫層面鎖起來
// （因為這個 App 沒有真正的帳號系統，沒辦法在資料庫規則裡驗證「你是不是 Bob」）。
// 真正保證不會離開這台裝置的只有「🔒 只有我看得到」（見 lib/privateShopping.js）。

function sanitizeMemberId(nickname) {
  return (nickname || "").replace(/[\/.#$\[\]]/g, "_") || "anon";
}

function isSharedItemVisible(item, nickname) {
  if (!item.visibleTo || item.visibleTo.length === 0) return true;
  return item.visibleTo.indexOf(nickname) >= 0 || item.addedBy === nickname;
}
