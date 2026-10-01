// 有 Google 登入就讀雲端那份（跨裝置同步），沒有登入就讀這台裝置的 localStorage
function usePrivateShoppingItems(tripId) {
  const auth = useAuth();
  const isCloud = auth.isGoogle;
  const { data: cloudItems } = useCollection(isCloud ? "users/" + auth.user.uid + "/trips/" + tripId + "/privateShopping" : null);

  const [localItems, setLocalItems] = React.useState(function () { return readPrivateShoppingItems(tripId); });
  React.useEffect(function () {
    function refresh() { setLocalItems(readPrivateShoppingItems(tripId)); }
    refresh();
    privateShoppingListeners.push(refresh);
    return function () {
      const idx = privateShoppingListeners.indexOf(refresh);
      if (idx >= 0) privateShoppingListeners.splice(idx, 1);
    };
  }, [tripId]);

  return isCloud ? cloudItems : localItems;
}
