// 請填入你自己的金鑰。留空也能開啟 App，只是對應功能會退回簡化版。
//
// Firebase：https://console.firebase.google.com/ 建立專案 -> 專案設定 -> 一般 -> 你的應用程式(Web) -> SDK 設定
//   記得到 Authentication 分頁啟用「匿名」登入方式，Firestore Database 也要建立一次（用預設規則即可，之後再貼 firestore.rules.txt 裡的規則）
// Cloudinary（購物清單截圖存放，免信用卡）：https://cloudinary.com/users/register/free 註冊免費帳號
//   後台 Settings -> Upload -> Upload presets -> Add upload preset，把 Signing Mode 改成 "Unsigned"，存檔後把 Cloud name 和 preset 名稱填在下面
// Google Maps：https://console.cloud.google.com/google/maps-apis 開通 Maps JavaScript API、Places API、Directions API
// OpenWeatherMap：https://openweathermap.org/api 註冊免費帳號取得 API key

const CONFIG = {
  firebase: {
    apiKey: "AIzaSyDEmA1280Ucmqk07lyD6936rNBps6jYnoE",
    authDomain: "travel-planning-a3b1a.firebaseapp.com",
    projectId: "travel-planning-a3b1a",
    storageBucket: "travel-planning-a3b1a.firebasestorage.app",
    messagingSenderId: "940853643787",
    appId: "1:940853643787:web:eb82d6e60e555f4291550e",
  },
  cloudinary: {
    cloudName: "deild3a6",
    uploadPreset: "wsjoqisv",
  },
  googleMapsApiKey: "",
  openWeatherApiKey: "0037dd28a550d71e31a947738b8b30cc",
};
