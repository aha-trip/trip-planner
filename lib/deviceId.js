// 每個瀏覽器一組固定的隨機代碼，用來認「這台裝置是不是當初建立行程的那個人」（沒有帳號系統下的替代方案）
function getDeviceId() {
  try {
    let id = localStorage.getItem("travel-app-device-id");
    if (!id) {
      id = generateId(20);
      localStorage.setItem("travel-app-device-id", id);
    }
    return id;
  } catch (e) {
    return "no-storage";
  }
}
