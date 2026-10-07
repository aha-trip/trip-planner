function parseRoute(hash) {
  const path = (hash || "").replace(/^#/, "");
  // 第三段是選填的附加參數，目前用在「從願望清單點進地圖，直接定位到那個地點」
  const tripMatch = path.match(/^\/trip\/([^/]+)\/([^/]+)(?:\/([^/]+))?/);
  if (tripMatch) {
    const validTabs = ["wishlist", "itinerary", "map", "expenses", "packing", "shopping", "print"];
    const tab = validTabs.indexOf(tripMatch[2]) >= 0 ? tripMatch[2] : "wishlist";
    return { page: "trip", tripId: tripMatch[1], tab: tab, extra: tripMatch[3] || null };
  }
  if (path === "/demo") {
    return { page: "demo" };
  }
  return { page: "home" };
}

function App() {
  const [route, setRoute] = React.useState(function () {
    return parseRoute(window.location.hash);
  });

  React.useEffect(function () {
    function onHashChange() {
      setRoute(parseRoute(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return function () {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  let page;
  if (route.page === "trip" && route.tab === "print") {
    page = <TripPrintView tripId={route.tripId} />;
  } else if (route.page === "trip") {
    page = <TripLayout tripId={route.tripId} activeTab={route.tab} focusItemId={route.extra} />;
  } else if (route.page === "demo") {
    page = <DemoTrip />;
  } else {
    page = <Home />;
  }

  return (
    <React.Fragment>
      {page}
      <UndoToastHost />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
