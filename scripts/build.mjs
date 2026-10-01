// 正式發布用的打包腳本，只在 GitHub Actions 裡跑，本機開發不需要執行這個檔案。
//
// 做的事：
// 1. 讀 index.html，把 <!-- BUILD:LOCAL_SCRIPTS_START --> ~ END 之間列出的本機 .js/.jsx 檔案
//    （lib/、hooks/、components/、App.js），依照原本的順序整個接起來——
//    這些檔案本來就是靠「依序用 <script> 載入、共用同一個全域作用域」在互相呼叫，
//    不是用 import/export 寫的，所以用「照順序接成一個檔案」就能完全保留原本的行為，
//    不用去改寫這幾十個檔案。
// 2. 用 esbuild 把接起來的內容做 JSX 轉譯 + 壓縮，輸出成一個 bundle 檔。
// 3. 產生正式版的 index.html：把本機逐一載入 script 的那一段，換成一行載入 bundle，
//    其餘（Tailwind/Firebase/MapLibre 等 CDN、config.js）原封不動。
// 4. 把 dist/ 準備成可以直接發布的樣子（index.html、bundle、config.js、favicon.svg 等靜態檔）。

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");

const START_MARKER = "<!-- BUILD:LOCAL_SCRIPTS_START -->";
const END_MARKER = "<!-- BUILD:LOCAL_SCRIPTS_END -->";

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
  const candidates = ["config.js", "favicon.svg", "manifest.json", "icon-192.png", "icon-512.png"];
  candidates.forEach(function (name) {
    const src = join(root, name);
    if (existsSync(src)) copyFileSync(src, join(distDir, name));
  });
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

  const prodHtml = buildProdIndexHtml(html, bundleFileName);
  writeFileSync(join(distDir, "index.html"), prodHtml);

  copyStaticAssets();

  console.log("完成，輸出在 dist/（bundle 檔名含內容雜湊 " + hash + "，內容沒變就不會換檔名，瀏覽器快取能正常運作；內容一變雜湊就會跟著變，不用再手動改 ?v=2）。");
}

main();
