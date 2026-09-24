// 免設定 Firebase 的「本機試玩模式」：用瀏覽器的 localStorage 模擬一份跟 Firestore/Storage
// 長得很像的 API（.collection/.doc/.onSnapshot/.where/.orderBy/.batch...），
// 這樣其他頁面的程式碼完全不用知道現在是本機模式還是真的 Firebase。
//
// 限制：只在「這台電腦、這個瀏覽器」有效，換裝置或換瀏覽器就看不到彼此的資料，
// 圖片也是直接轉成 base64 存進 localStorage，數量多或檔案大可能會超過瀏覽器儲存上限。

const LOCAL_DB_KEY = "travel-app-local-db";
const localBackendListeners = [];

function localBackendReadTree() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function localBackendWriteTree(tree) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(tree));
  localBackendNotify();
}

function localBackendNotify() {
  localBackendListeners.slice().forEach(function (fn) { fn(); });
}

window.addEventListener("storage", function (e) {
  if (e.key === LOCAL_DB_KEY) localBackendNotify();
});

function localBackendSplitPath(path) {
  return path.split("/").filter(Boolean);
}

function localBackendSerialize(value) {
  if (value && typeof value.toMillis === "function") {
    return { __ts: value.toMillis() };
  }
  if (Array.isArray(value)) return value.map(localBackendSerialize);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach(function (k) { out[k] = localBackendSerialize(value[k]); });
    return out;
  }
  return value === undefined ? null : value;
}

function localBackendDeserialize(value) {
  if (value && typeof value === "object" && !Array.isArray(value) && "__ts" in value) {
    const millis = value.__ts;
    return { toMillis: function () { return millis; }, toDate: function () { return new Date(millis); } };
  }
  if (Array.isArray(value)) return value.map(localBackendDeserialize);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach(function (k) { out[k] = localBackendDeserialize(value[k]); });
    return out;
  }
  return value;
}

function localBackendGetNode(tree, segments) {
  let node = tree;
  for (let i = 0; i < segments.length; i++) {
    if (node == null) return undefined;
    node = node[segments[i]];
  }
  return node;
}

function localBackendSetNode(tree, segments, value) {
  let node = tree;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (typeof node[key] !== "object" || node[key] == null) node[key] = {};
    node = node[key];
  }
  node[segments[segments.length - 1]] = value;
}

function localBackendDeleteNode(tree, segments) {
  let node = tree;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    if (node[key] == null) return;
    node = node[key];
  }
  delete node[segments[segments.length - 1]];
}

function localBackendDocSnapshot(id, rawData) {
  const exists = rawData != null;
  return {
    id: id,
    exists: exists,
    data: function () { return exists ? localBackendDeserialize(rawData) : undefined; },
  };
}

function localBackendMakeDocRef(path) {
  const segments = localBackendSplitPath(path);
  return {
    id: segments[segments.length - 1],
    get: function () {
      const raw = localBackendGetNode(localBackendReadTree(), segments);
      return Promise.resolve(localBackendDocSnapshot(segments[segments.length - 1], raw));
    },
    set: function (data) {
      const tree = localBackendReadTree();
      localBackendSetNode(tree, segments, localBackendSerialize(data));
      localBackendWriteTree(tree);
      return Promise.resolve();
    },
    update: function (data) {
      const tree = localBackendReadTree();
      const existing = localBackendGetNode(tree, segments) || {};
      localBackendSetNode(tree, segments, Object.assign({}, existing, localBackendSerialize(data)));
      localBackendWriteTree(tree);
      return Promise.resolve();
    },
    delete: function () {
      const tree = localBackendReadTree();
      localBackendDeleteNode(tree, segments);
      localBackendWriteTree(tree);
      return Promise.resolve();
    },
    onSnapshot: function (onNext, onError) {
      function fire() {
        try {
          const raw = localBackendGetNode(localBackendReadTree(), segments);
          onNext(localBackendDocSnapshot(segments[segments.length - 1], raw));
        } catch (e) {
          if (onError) onError(e);
        }
      }
      fire();
      localBackendListeners.push(fire);
      return function () {
        const idx = localBackendListeners.indexOf(fire);
        if (idx >= 0) localBackendListeners.splice(idx, 1);
      };
    },
  };
}

function localBackendExtractSortValue(value) {
  if (value && typeof value === "object" && "__ts" in value) return value.__ts;
  return value;
}

function localBackendMakeCollectionRef(path, filters, sort) {
  filters = filters || [];
  sort = sort || null;
  const segments = localBackendSplitPath(path);

  function readDocs() {
    const node = localBackendGetNode(localBackendReadTree(), segments) || {};
    let docs = Object.keys(node).map(function (id) { return { id: id, data: node[id] }; });

    filters.forEach(function (f) {
      docs = docs.filter(function (d) {
        const raw = d.data ? d.data[f.field] : undefined;
        const actual = localBackendExtractSortValue(raw);
        const target = f.value && typeof f.value.toMillis === "function" ? f.value.toMillis() : f.value;
        return actual === target;
      });
    });

    if (sort) {
      docs.sort(function (a, b) {
        const av = localBackendExtractSortValue(a.data ? a.data[sort.field] : undefined);
        const bv = localBackendExtractSortValue(b.data ? b.data[sort.field] : undefined);
        if (av == null && bv == null) return 0;
        if (av == null) return -1;
        if (bv == null) return 1;
        if (av < bv) return sort.direction === "desc" ? 1 : -1;
        if (av > bv) return sort.direction === "desc" ? -1 : 1;
        return 0;
      });
    }

    return docs;
  }

  return {
    where: function (field, op, value) {
      return localBackendMakeCollectionRef(path, filters.concat([{ field: field, op: op, value: value }]), sort);
    },
    orderBy: function (field, direction) {
      return localBackendMakeCollectionRef(path, filters, { field: field, direction: direction || "asc" });
    },
    add: function (data) {
      const id = generateId(16);
      const tree = localBackendReadTree();
      localBackendSetNode(tree, segments.concat([id]), localBackendSerialize(data));
      localBackendWriteTree(tree);
      return Promise.resolve(localBackendMakeDocRef(path + "/" + id));
    },
    doc: function (id) {
      return localBackendMakeDocRef(path + "/" + id);
    },
    onSnapshot: function (onNext, onError) {
      function fire() {
        try {
          const docs = readDocs().map(function (d) { return localBackendDocSnapshot(d.id, d.data); });
          onNext({ docs: docs });
        } catch (e) {
          if (onError) onError(e);
        }
      }
      fire();
      localBackendListeners.push(fire);
      return function () {
        const idx = localBackendListeners.indexOf(fire);
        if (idx >= 0) localBackendListeners.splice(idx, 1);
      };
    },
  };
}

function createLocalDb() {
  return {
    doc: function (path) { return localBackendMakeDocRef(path); },
    collection: function (path) { return localBackendMakeCollectionRef(path); },
    batch: function () {
      const ops = [];
      return {
        set: function (ref, data) { ops.push(function () { return ref.set(data); }); },
        update: function (ref, data) { ops.push(function () { return ref.update(data); }); },
        delete: function (ref) { ops.push(function () { return ref.delete(); }); },
        commit: function () {
          return ops.reduce(function (p, run) { return p.then(run); }, Promise.resolve());
        },
      };
    },
  };
}

function createLocalStorageBackend() {
  return {
    ref: function (path) {
      const segments = ["__files"].concat(localBackendSplitPath(path));
      return {
        put: function (file) {
          return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () {
              const tree = localBackendReadTree();
              localBackendSetNode(tree, segments, reader.result);
              localBackendWriteTree(tree);
              resolve();
            };
            reader.onerror = function () { reject(new Error("讀取檔案失敗")); };
            reader.readAsDataURL(file);
          });
        },
        getDownloadURL: function () {
          const dataUrl = localBackendGetNode(localBackendReadTree(), segments);
          return Promise.resolve(dataUrl || "");
        },
        delete: function () {
          const tree = localBackendReadTree();
          localBackendDeleteNode(tree, segments);
          localBackendWriteTree(tree);
          return Promise.resolve();
        },
      };
    },
  };
}
