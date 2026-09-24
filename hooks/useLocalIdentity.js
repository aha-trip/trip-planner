// 管理「暱稱」身分，存在 localStorage，不需要帳號登入。
function useLocalIdentity() {
  const [nickname, setNicknameState] = React.useState(function () {
    try {
      return localStorage.getItem("travel-app-nickname") || "";
    } catch (e) {
      return "";
    }
  });

  function setNickname(name) {
    setNicknameState(name);
    try {
      localStorage.setItem("travel-app-nickname", name);
    } catch (e) {
      // 私密瀏覽模式等情況下 localStorage 可能不可用，忽略即可
    }
  }

  return { nickname, setNickname };
}
