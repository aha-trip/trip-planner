function usePrivatePackingItems(tripId) {
  const [items, setItems] = React.useState(function () { return readPrivatePackingItems(tripId); });

  React.useEffect(function () {
    function refresh() { setItems(readPrivatePackingItems(tripId)); }
    refresh();
    privatePackingListeners.push(refresh);
    return function () {
      const idx = privatePackingListeners.indexOf(refresh);
      if (idx >= 0) privatePackingListeners.splice(idx, 1);
    };
  }, [tripId]);

  return items;
}
