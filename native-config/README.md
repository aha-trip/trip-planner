# 這個資料夾放什麼

App 裡的 Google 登入要正常運作，需要兩個從 Firebase Console 下載的設定檔，照 [SETUP.md](../SETUP.md)
「App 內 Google 登入」那節設定好之後，把下載到的檔案**原封不動**放進這個資料夾，檔名要完全一樣：

- `google-services.json`（Android 用）
- `GoogleService-Info.plist`（iOS 用）

放進來、提交推上去之後，下次跑「打包 Android App」/「打包 iOS App」的流程就會自動接上去，
Google 登入在 App 裡才會真的能用。

**這兩個檔案可以放心公開**（這個 repo 本來就是公開的）：裡面是 Firebase 專案的識別資訊，不是密碼，
跟專案裡 [config.js](../config.js) 放的網頁版 Firebase 設定是同一個等級的東西，Google 官方文件也說明
這兩個檔案設計上就是給前端/手機 App 內建使用的，安全性是靠 Firestore 規則把關，不是靠藏住這個檔案。

還沒放的話完全沒關係，App 一樣打包得出來，只是裡面的 Google 登入按鈕按了會失敗，其他功能都正常。
