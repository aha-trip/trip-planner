// 訂閱一個 Firestore collection，回傳即時同步的陣列。
// collectionPath 例如 `trips/${tripId}/wishlistItems`
// queryFn(ref) 可選，用來加 orderBy/where，例如 ref => ref.orderBy('createdAt')
function useCollection(collectionPath, queryFn) {
  const [state, setState] = React.useState({ data: [], loading: true, error: null });

  React.useEffect(function () {
    if (!firebaseEnabled || !collectionPath) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let unsubscribe = null;
    let cancelled = false;

    authReadyPromise.then(function () {
      if (cancelled) return;
      let ref = db.collection(collectionPath);
      if (queryFn) ref = queryFn(ref);

      unsubscribe = ref.onSnapshot(
        function (snapshot) {
          const data = snapshot.docs.map(function (doc) {
            return Object.assign({ id: doc.id }, doc.data());
          });
          setState({ data: data, loading: false, error: null });
        },
        function (error) {
          console.error("讀取 " + collectionPath + " 失敗:", error);
          setState({ data: [], loading: false, error: error });
        }
      );
    });

    return function () {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [collectionPath]);

  return state;
}

// 訂閱單一 Firestore 文件
function useDocument(docPath) {
  const [state, setState] = React.useState({ data: null, loading: true, error: null });

  React.useEffect(function () {
    if (!firebaseEnabled || !docPath) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let unsubscribe = null;
    let cancelled = false;

    authReadyPromise.then(function () {
      if (cancelled) return;
      unsubscribe = db.doc(docPath).onSnapshot(
        function (doc) {
          setState({
            data: doc.exists ? Object.assign({ id: doc.id }, doc.data()) : null,
            loading: false,
            error: null,
          });
        },
        function (error) {
          console.error("讀取 " + docPath + " 失敗:", error);
          setState({ data: null, loading: false, error: error });
        }
      );
    });

    return function () {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [docPath]);

  return state;
}
