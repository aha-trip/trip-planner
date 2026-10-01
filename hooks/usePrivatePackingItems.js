// 有 Google 登入就讀雲端那份（跨裝置同步），沒有登入就讀這台裝置的 localStorage
function usePrivatePackingItems(tripId) {
  const auth = useAuth();
  const isCloud = auth.isGoogle;
  const { data: cloudItems } = useCollection(isCloud ? "users/" + auth.user.uid + "/trips/" + tripId + "/privatePacking" : null);

  const [localItems, setLocalItems] = React.useState(function () { return readPrivatePackingItems(tripId); });
  React.useEffect(function () {
    function refresh() { setLocalItems(readPrivatePackingItems(tripId)); }
    refresh();
    privatePackingListeners.push(refresh);
    return function () {
      const idx = privatePackingListeners.indexOf(refresh);
      if (idx >= 0) privatePackingListeners.splice(idx, 1);
    };
  }, [tripId]);

  return isCloud ? cloudItems : localItems;
}
