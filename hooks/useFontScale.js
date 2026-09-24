// 全站字體大小（照顧長輩/視力不便的使用者）：調整 <html> 的 font-size 百分比，
// 因為 Tailwind 的文字大小預設都是 rem 單位，這樣一調全部頁面的文字會一起等比放大。
const FONT_SCALE_KEY = "travel-app-font-scale";
const FONT_SCALE_LEVELS = [100, 115, 130, 150];
const fontScaleListeners = [];

function getFontScale() {
  try {
    const v = parseInt(localStorage.getItem(FONT_SCALE_KEY), 10);
    return FONT_SCALE_LEVELS.indexOf(v) >= 0 ? v : 100;
  } catch (e) {
    return 100;
  }
}

function applyFontScale(v) {
  document.documentElement.style.fontSize = v + "%";
  try { localStorage.setItem(FONT_SCALE_KEY, String(v)); } catch (e) {}
  fontScaleListeners.slice().forEach(function (fn) { fn(v); });
}

function useFontScale() {
  const [scale, setScale] = React.useState(getFontScale);

  React.useEffect(function () {
    document.documentElement.style.fontSize = scale + "%";
    fontScaleListeners.push(setScale);
    return function () {
      const idx = fontScaleListeners.indexOf(setScale);
      if (idx >= 0) fontScaleListeners.splice(idx, 1);
    };
    // eslint-disable-next-line
  }, []);

  function cycle() {
    const idx = FONT_SCALE_LEVELS.indexOf(scale);
    applyFontScale(FONT_SCALE_LEVELS[(idx + 1) % FONT_SCALE_LEVELS.length]);
  }

  return { scale, cycle, levels: FONT_SCALE_LEVELS };
}
