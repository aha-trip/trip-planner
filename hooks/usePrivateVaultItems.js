// 有 Google 登入就讀雲端那份（跨裝置同步），沒有登入就讀這台裝置的 localStorage
function usePrivateVaultItems(tripId) {
  const auth = useAuth();
  const isCloud = auth.isGoogle;
  const { data: cloudItems } = useCollection(isCloud ? "users/" + auth.user.uid + "/trips/" + tripId + "/vaultItems" : null);

  const [localItems, setLocalItems] = React.useState(function () { return readPrivateVaultItems(tripId); });
  React.useEffect(function () {
    function refresh() { setLocalItems(readPrivateVaultItems(tripId)); }
    refresh();
    privateVaultListeners.push(refresh);
    return function () {
      const idx = privateVaultListeners.indexOf(refresh);
      if (idx >= 0) privateVaultListeners.splice(idx, 1);
    };
  }, [tripId]);

  return isCloud ? cloudItems : localItems;
}
