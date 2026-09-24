function parseRoute(hash) {
  const path = (hash || "").replace(/^#/, "");
  const tripMatch = path.match(/^\/trip\/([^/]+)\/([^/]+)/);
  if (tripMatch) {
    const validTabs = ["wishlist", "itinerary", "shopping", "print"];
    const tab = validTabs.indexOf(tripMatch[2]) >= 0 ? tripMatch[2] : "wishlist";
    return { page: "trip", tripId: tripMatch[1], tab: tab };
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
    page = <TripLayout tripId={route.tripId} activeTab={route.tab} />;
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
