// 即時同步的全站預約規則庫：優先讀 Firestore 的 bookingRules collection（你在
// #/admin/booking-rules 後台維護的內容），Firestore 還沒回應/連不上時，用
// lib/bookingRules.js 裡的 DEFAULT_BOOKING_RULES 頂著，確保雷達任何時候都有規則可以比對。
let liveRules = null; // null = 還沒收到 Firestore 的第一次回應

function initBookingRulesSync() {
  if (!usingRealFirebase) return; // 本機試玩模式沒有共用的規則庫，一律用內建預設清單
  db.collection("bookingRules").onSnapshot(
    function (snapshot) {
      liveRules = snapshot.docs.map(function (doc) { return Object.assign({ id: doc.id }, doc.data()); });
    },
    function (err) {
      console.warn("讀取預約規則庫失敗，退回內建預設清單:", err);
    }
  );
}

function getActiveBookingRules() {
  return liveRules && liveRules.length > 0 ? liveRules : DEFAULT_BOOKING_RULES;
}
