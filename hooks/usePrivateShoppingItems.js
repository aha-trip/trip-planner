// 訂閱「只有我看得到」的購物清單項目（見 lib/privateShopping.js），介面跟 useCollection 類似，
// 但資料來源是 localStorage，不是 Firestore/本機共用資料庫。
function usePrivateShoppingItems(tripId) {
  const [items, setItems] = React.useState(function () { return readPrivateShoppingItems(tripId); });

  React.useEffect(function () {
    function refresh() { setItems(readPrivateShoppingItems(tripId)); }
    refresh();
    privateShoppingListeners.push(refresh);
    return function () {
      const idx = privateShoppingListeners.indexOf(refresh);
      if (idx >= 0) privateShoppingListeners.splice(idx, 1);
    };
  }, [tripId]);

  return items;
}
