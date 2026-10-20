// 正式打包時 Tailwind CLI 真正吃的設定檔（見 scripts/build.mjs 的 buildTailwindCss）。
// index.html 裡 BUILD:TAILWIND_CDN_START/END 之間的 `tailwind.config = {...}` 是本機開發用
// Play CDN 版的設定，兩邊的 theme.extend 要保持一致，改配色記得兩邊都要改。
module.exports = {
  content: ["./index.html", "./App.js", "./components/**/*.js", "./hooks/**/*.js", "./lib/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef6ee",
          100: "#fdead4",
          200: "#fad3a8",
          300: "#f6b571",
          400: "#f19540",
          500: "#e97a24",
          600: "#d4611a",
          700: "#b04c17",
          800: "#8d3d19",
          900: "#733417",
        },
        cream: "#fbf4e6",
      },
    },
  },
};
