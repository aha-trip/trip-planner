// 標頭自動收合：往下捲動時收起來（讓畫面看得更多），往上捲一點點、或滑鼠移到畫面最上方時就浮現。
// 用「累積位移」而不是比較單一次 scroll 事件，避免平滑捲動（trackpad 等）時每次位移太小、一直達不到門檻。
function useAutoHideHeader() {
  const [visible, setVisible] = React.useState(true);
  const lastY = React.useRef(0);
  const accum = React.useRef(0);

  React.useEffect(function () {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;

      if (y < 40) {
        setVisible(true);
        accum.current = 0;
        return;
      }

      if (delta > 0) {
        accum.current = accum.current > 0 ? accum.current + delta : delta;
      } else if (delta < 0) {
        accum.current = accum.current < 0 ? accum.current + delta : delta;
      }

      if (accum.current > 24) {
        setVisible(false);
      } else if (accum.current < -12) {
        setVisible(true);
      }
    }
    function onMouseMove(e) {
      if (e.clientY < 80) setVisible(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    return function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return visible;
}
