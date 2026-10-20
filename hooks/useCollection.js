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
          // 讀到「不存在」而且這筆結果是從本機快取來的（不是剛跟伺服器確認過）：
          // 不要直接相信，強制跟伺服器再核對一次，避免相信到過期的「查不到」快取
          // （這是之前 firebase.js 關掉離線快取想避開的那個 bug，現在改成這樣處理）。
          if (!doc.exists && usingRealFirebase && doc.metadata && doc.metadata.fromCache) {
            db.doc(docPath).get({ source: "server" }).then(function (serverDoc) {
              if (cancelled) return;
              setState({
                data: serverDoc.exists ? Object.assign({ id: serverDoc.id }, serverDoc.data()) : null,
                loading: false,
                error: null,
              });
            }).catch(function (err) {
              // 真的離線查不到伺服器：先不要下「不存在」的結論，保留原本狀態等恢復連線後
              // onSnapshot 自然會再送一次正確結果
              console.warn("核對伺服器資料失敗（可能真的離線）:", err);
            });
            return;
          }
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
