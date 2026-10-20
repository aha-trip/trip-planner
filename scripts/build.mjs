// 正式發布用的打包腳本，只在 GitHub Actions 裡跑，本機開發不需要執行這個檔案。
//
// 做的事：
// 1. 讀 index.html，把 <!-- BUILD:LOCAL_SCRIPTS_START --> ~ END 之間列出的本機 .js/.jsx 檔案
//    （lib/、hooks/、components/、App.js），依照原本的順序整個接起來——
//    這些檔案本來就是靠「依序用 <script> 載入、共用同一個全域作用域」在互相呼叫，
//    不是用 import/export 寫的，所以用「照順序接成一個檔案」就能完全保留原本的行為，
//    不用去改寫這幾十個檔案。
// 2. 用 esbuild 把接起來的內容做 JSX 轉譯 + 壓縮，輸出成一個 bundle 檔。
// 3. 產生正式版的 index.html：把本機逐一載入 script 的那一段，換成一行載入 bundle。
// 4. 把 React/Firebase/MapLibre 這幾個原本從 CDN 載入的函式庫，換成 vendor/ 資料夾裡固定版本的
//    本機檔案（見下面 VENDOR_FILES）——這樣原生 App 包裝成離線版之後，不需要連網就能把整個
//    App 殼打開，不是每個 CDN 資源都換，細節見 VENDOR_FILES 上面的註解。
// 5. 把 dist/ 準備成可以直接發布的樣子（index.html、bundle、config.js、favicon.png 等靜態檔）。

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import * as esbuild from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");
const vendorDir = join(root, "vendor");

const START_MARKER = "<!-- BUILD:LOCAL_SCRIPTS_START -->";
const END_MARKER = "<!-- BUILD:LOCAL_SCRIPTS_END -->";
const TAILWIND_START_MARKER = "<!-- BUILD:TAILWIND_CDN_START -->";
const TAILWIND_END_MARKER = "<!-- BUILD:TAILWIND_CDN_END -->";

// 階段 1（O1）：App 包裝成原生版之後，不能每次開啟都依賴 CDN（離線或 CDN 暫時連不上就整個打不開）。
// 把這幾個函式庫固定版本下載好、提交進 vendor/ 資料夾（見 SETUP.md 更新流程），正式打包時
// 把 index.html 裡對應的 CDN <script src="..."> / <link href="..."> 換成本機檔案，複製進 dist/vendor/。
// 不是每個 CDN 資源都换：Google 登入用的 accounts.google.com/gsi/client 是第三方 OAuth 腳本，
// 本來就不能自行下載代管，而且原生 App 走的是另一套原生登入外掛，不依賴這支腳本，所以留著不動；
// Tailwind 的即時編譯 CDN 版是下一階段另外處理的事（改用 Tailwind CLI 預先編譯），不在這份清單裡。
const VENDOR_FILES = [
  { cdnUrl: "https://unpkg.com/react@18/umd/react.production.min.js", file: "react.production.min.js" },
  { cdnUrl: "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", file: "react-dom.production.min.js" },
  { cdnUrl: "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css", file: "maplibre-gl.css" },
  { cdnUrl: "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js", file: "maplibre-gl.js" },
  { cdnUrl: "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js", file: "firebase-app-compat.js" },
  { cdnUrl: "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js", file: "firebase-auth-compat.js" },
  { cdnUrl: "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js", file: "firebase-firestore-compat.js" },
  { cdnUrl: "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage-compat.js", file: "firebase-storage-compat.js" },
];

function readIndexHtml() {
  return readFileSync(join(root, "index.html"), "utf8");
}

function extractLocalScriptPaths(html) {
  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("找不到 index.html 裡的 BUILD:LOCAL_SCRIPTS_START/END 標記，建置中止。");
  }
  const block = html.slice(startIdx, endIdx);
  const paths = [];
  const re = /<script[^>]*\ssrc="([^"]+)"[^>]*><\/script>/g;
  let m;
  while ((m = re.exec(block))) {
    const src = m[1];
    if (src.startsWith("http://") || src.startsWith("https://")) continue; // 跳過 Babel standalone 這種 CDN 腳本
    paths.push(src.split("?")[0]); // 去掉 ?v=2 這種快取參數，對應到真正的檔案路徑
  }
  if (paths.length === 0) {
    throw new Error("在標記範圍內一個本機 script 檔案都沒找到，建置中止。");
  }
  return paths;
}

function concatenateSources(paths) {
  return paths
    .map(function (relPath) {
      const content = readFileSync(join(root, relPath), "utf8");
      // 每個檔案之間強制用分號分隔，避免自動分號補完（ASI）在檔案邊界誤判語法
      return "// ---- " + relPath + " ----\n" + content + "\n;\n";
    })
    .join("\n");
}

function buildBundle(combinedSource) {
  const result = esbuild.transformSync(combinedSource, {
    loader: "jsx",
    jsx: "transform", // classic runtime：編出來呼叫全域的 React.createElement，跟 Babel standalone 原本的行為一致
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    minify: true,
    target: ["chrome100", "safari15", "ios15", "firefox100", "edge100"],
    sourcemap: false,
  });
  if (result.warnings.length) {
    result.warnings.forEach(function (w) { console.warn(w.text); });
  }
  return result.code;
}

function contentHash(content) {
  return createHash("sha1").update(content).digest("hex").slice(0, 10);
}

function buildProdIndexHtml(html, bundleFileName) {
  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER) + END_MARKER.length;
  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx);
  return before + '<script src="' + bundleFileName + '"></script>' + after;
}

function copyStaticAssets() {
  const candidates = ["config.js", "favicon.png", "logo-icon.png", "manifest.json", "icon-192.png", "icon-512.png"];
  candidates.forEach(function (name) {
    const src = join(root, name);
    if (existsSync(src)) copyFileSync(src, join(distDir, name));
  });
}

// 階段 2（O1）：開發時用 Tailwind 的「Play CDN」版現場編譯 CSS，方便但不能用在離線的原生 App 裡
// （沒網路連不到 cdn.tailwindcss.com，整個頁面會變成沒有任何樣式）。正式打包改用 Tailwind CLI
// 把 tailwind.config.js 設定的內容，連同程式碼裡實際用到的 class 名稱，預先編譯成一份靜態 CSS。
function buildTailwindCss() {
  const cliEntry = join(root, "node_modules", "tailwindcss", "lib", "cli.js");
  const outPath = join(distDir, "tailwind.css");
  execFileSync(process.execPath, [
    cliEntry,
    "-i", join(root, "tailwind.src.css"),
    "-o", outPath,
    "--minify",
  ], { stdio: "inherit", cwd: root });
  if (!existsSync(outPath)) {
    throw new Error("Tailwind CSS 編譯失敗，沒有產生出 dist/tailwind.css。");
  }
}

function replaceTailwindCdnTag(html) {
  const startIdx = html.indexOf(TAILWIND_START_MARKER);
  const endIdx = html.indexOf(TAILWIND_END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("找不到 index.html 裡的 BUILD:TAILWIND_CDN_START/END 標記，建置中止。");
  }
  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx + TAILWIND_END_MARKER.length);
  return before + '<link rel="stylesheet" href="tailwind.css" />' + after;
}

// 把 CDN 函式庫換成本機檔案：複製進 dist/vendor/，並把 index.html 裡對應的網址換成本機路徑
function inlineVendorFiles(html) {
  const vendorOutDir = join(distDir, "vendor");
  mkdirSync(vendorOutDir, { recursive: true });

  let result = html;
  VENDOR_FILES.forEach(function (v) {
    const src = join(vendorDir, v.file);
    if (!existsSync(src)) {
      throw new Error(
        "找不到 vendor/" + v.file + "，請先下載這個檔案放進 vendor/ 資料夾（見 SETUP.md「O1 離線函式庫」那節）。"
      );
    }
    copyFileSync(src, join(vendorOutDir, v.file));
    if (result.indexOf(v.cdnUrl) === -1) {
      throw new Error("index.html 裡找不到預期的 CDN 網址：" + v.cdnUrl + "，可能是版本號改了，vendor 清單要跟著更新。");
    }
    result = result.split(v.cdnUrl).join("vendor/" + v.file);
  });
  return result;
}

function main() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });

  const html = readIndexHtml();
  const scriptPaths = extractLocalScriptPaths(html);
  console.log("打包 " + scriptPaths.length + " 個本機檔案：\n  " + scriptPaths.join("\n  "));

  const combined = concatenateSources(scriptPaths);
  const bundleCode = buildBundle(combined);
  const hash = contentHash(bundleCode);
  const bundleFileName = "bundle." + hash + ".js";
  writeFileSync(join(distDir, bundleFileName), bundleCode);

  let prodHtml = buildProdIndexHtml(html, bundleFileName);
  prodHtml = inlineVendorFiles(prodHtml);
  prodHtml = replaceTailwindCdnTag(prodHtml);
  writeFileSync(join(distDir, "index.html"), prodHtml);

  buildTailwindCss();
  copyStaticAssets();

  console.log("完成，輸出在 dist/（bundle 檔名含內容雜湊 " + hash + "，內容沒變就不會換檔名，瀏覽器快取能正常運作；內容一變雜湊就會跟著變，不用再手動改 ?v=2）。");
}

main();
