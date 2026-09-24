# 設定與執行說明

這個 App 完全不需要安裝 Node.js / npm，所有函式庫都透過瀏覽器 CDN 載入，JSX 由瀏覽器內建的 Babel 即時轉譯。

## 1. 本機開啟——先用「本機試玩模式」，完全不用設定任何東西

**不要直接雙擊 `index.html`**——瀏覽器的 `file://` 保護機制會擋掉這個 App 讀取自己檔案的方式，畫面會卡在「載入中...」不會動。

正確做法：在 VS Code 安裝 "Live Server" 擴充套件（作者 Ritwick Dey），對 `index.html` 按右鍵 -> 「Open with Live Server」，會用 `http://127.0.0.1:5500/...` 打開，這樣才會正常運作。

沒有設定 [config.js](config.js) 裡任何金鑰的話，App 會自動用**「本機試玩模式」**：資料存在你這個瀏覽器裡（localStorage），介面、所有功能操作起來都一樣，只是不會跟別人同步、換瀏覽器或裝置就看不到彼此的資料。畫面上方會有一條藍色提示條顯示目前是本機模式。這樣你可以先完整試過願望清單、排行程、購物清單整個流程，滿意之後再決定要不要往下做 Firebase 開放真正的多人共享。

## 2. 設定 Firebase（想要「多人即時共享」才需要——本機試玩模式不需要這步）

1. 前往 https://console.firebase.google.com/ 建立一個新專案（免費 Spark 方案即可）
2. 專案建立好之後：
   - 左側選單「Authentication」-> 上方分頁「Sign-in method」-> 啟用「匿名 (Anonymous)」，**再啟用「Google」**（填一個專案支援電子郵件就好，免費）
   - 同一頁的「Settings」分頁 -> 「Authorized domains」-> 加上你實際部署的網域（例如 `xxx.netlify.app` 或 `你的帳號.github.io`），不加的話部署後 Google 登入會被擋。本機用 Live Server 的 `127.0.0.1` 通常已在清單裡，若沒有也一併加上
   - 左側選單「Firestore」-> 建立資料庫 -> 版本選 **Standard**（不是 Enterprise）-> 地區選 `asia-east1` -> 建立
3. 左側選單「專案設定」(齒輪圖示) -> 一般 -> 往下滑「你的應用程式」-> 點 `</>` 新增一個 Web 應用程式 -> 複製出現的 `firebaseConfig` 物件
4. 打開專案裡的 [config.js](config.js)，把 `firebase` 欄位換成剛剛複製的內容
5. 回到 Firebase Console -> Firestore -> 上方分頁「規則(Rules)」-> 把 [firestore.rules.txt](firestore.rules.txt) 的內容整份貼上 -> 發布

做完這步，重新整理頁面就可以建立行程、多人即時同步了（可以開兩個瀏覽器分頁模擬兩個人）。

**注意：這裡故意跳過 Firebase Storage。** Firebase 現在規定 Storage 要升級到 Blaze（信用卡）方案才能用，所以購物清單截圖改用下一節的 Cloudinary，完全免費、不用信用卡。

## 2.5 設定 Cloudinary（購物清單截圖要能多人共享才需要，免信用卡）

沒做這步的話，購物清單截圖還是能用，只是每個人上傳的截圖只有自己看得到（存在自己瀏覽器裡），不會同步給其他人。

1. 前往 https://cloudinary.com/users/register/free 註冊一個免費帳號（不用信用卡）
2. 登入後在主控台首頁或左側選單找到 **Cloud name**（一串英數字，通常在畫面右上角附近），記下來
3. 左側選單「Settings」(齒輪圖示) -> 上方分頁「Upload」-> 找到「Upload presets」區塊 -> 「Add upload preset」
4. 把「Signing Mode」從 `Signed` 改成 **`Unsigned`**（這樣瀏覽器才能直接上傳，不用後端伺服器）
5. 存檔，記下這個 preset 的名稱（Preset name）
6. 打開 [config.js](config.js)，把 `cloudinary.cloudName` 填成步驟 2 的 Cloud name、`cloudinary.uploadPreset` 填成步驟 5 的 preset 名稱

做完後重新整理頁面，購物清單截圖就會上傳到 Cloudinary、多人共享同步。

## 3. 設定 Google Maps（選用——沒設定的話退回手動輸入地址、導航按鈕改用地址搜尋，其餘都能用）

1. 前往 https://console.cloud.google.com/google/maps-apis/credentials（跟 Firebase 專案可以是不同的 Google Cloud 專案，也可以共用）
2. 需要先綁定一組帳單帳戶（Google 規定，但每月有固定免費額度）
3. 開通這三個 API：Maps JavaScript API、Places API、Directions API
4. 建立一組 API 金鑰，**強烈建議**設定「HTTP 參照網址限制」只允許你實際部署的網域使用，並在「配額」頁面設定每日上限，避免連結外流被濫用產生費用
5. 把金鑰貼到 [config.js](config.js) 的 `googleMapsApiKey`

## 4. 設定天氣 API（選用——沒設定的話天氣區塊會顯示「尚未設定」，其餘都能用）

1. 前往 https://openweathermap.org/api 註冊免費帳號，建立一組 API key（免信用卡）
2. 貼到 [config.js](config.js) 的 `openWeatherApiKey`
3. 注意：免費方案只能查到未來約 5 天的預報，超過範圍的日期會顯示「超過預報範圍」

## 5. 想讓朋友從手機打開連結一起編輯（部署成公開網址）

本機用 `file://` 打開只有你自己看得到。要讓別人用連結加入，需要放到一個有公開網址的地方，例如（都不需要安裝 Node.js）：

- **Netlify Drop**（最快）：打開 https://app.netlify.com/drop，把整個專案資料夾拖進去，幾秒後會得到一個公開網址
- **GitHub Pages**：把這個資料夾 push 到一個 GitHub repo，到 repo 的 Settings -> Pages 開啟，選擇要發布的分支

部署後把網址開頭換成你的公開網址，分享出去的連結就會是 `https://你的網址/#/trip/xxxxx/wishlist` 這種格式。

## 已知限制（原型階段的刻意取捨）

- 預設是「有連結就能編輯」（拿到連結的人有完整讀寫權限）。建立者可以在「行程成員」面板改成「只有 Google 登入的人能編輯」，沒登入的人只能看。這兩種模式知道連結的人都看得到內容，不是私人行程；也沒有「指定哪幾個 Google 帳號才能進」的邀請名單
- 「只限 Google 登入」模式下，沒登入的人畫面上的按鈕不會被停用，只是修改不會儲存（畫面上方有提示條）
- 只有建立者能切換編輯權限，判斷依據是建立行程時的帳號。如果建立者原本用匿名身分，之後在**另一台裝置**用「已經登入過的」Google 帳號登入，會變成不同帳號，就無法再切換權限；用同一台裝置按 Google 登入則不會有這問題（匿名身分會直接升級成 Google 帳號）
- 本機試玩模式沒有 Google 登入（沒有帳號系統）
- 多人同時搬動同一天的行程順序，極端情況下可能互相覆蓋
- 交通時間計算依賴 Google Directions API，沒有設定金鑰時只能手動輸入
- 本機試玩模式的截圖是直接轉成一長串文字存進瀏覽器，數量多或圖片很大時可能會超過瀏覽器儲存上限（一般約 5-10MB），到時候新增會失敗
- 用 Cloudinary 存截圖時，「刪除購物項目」只會讓 App 裡看不到，Cloudinary 上的圖片檔案本身不會真的被刪除（免登入上傳沒辦法安全地做遠端刪除），免費額度通常很夠用，不影響正常使用
- 願望清單/行程/購物清單的「刪除」都是軟刪除（標記隱藏 + 5 秒內可復原），資料庫裡其實還留著，不會真的清掉，所以資料量只會增加不會減少（對這個原型的使用規模不影響，但長期用量很大的話資料庫會慢慢變大）
- 「成員名單」是依暱稱記錄，沒登入的人清瀏覽器資料或換裝置會被當成新成員；用 Google 登入的話名稱固定用 Google 名稱。「建立者」身分綁在建立行程的那台裝置與帳號上（沒登入 Google 就清瀏覽器資料會失去管理權限，建議建立者用 Google 登入）
