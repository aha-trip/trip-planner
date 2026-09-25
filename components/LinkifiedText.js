// 把文字裡的網址（http/https）變成可以點開的連結，其他文字照常顯示
function LinkifiedText({ text, className }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s<>"'，。）)]+)/g);
  return (
    <span className={className}>
      {parts.map(function (part, i) {
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={function (e) { e.stopPropagation(); }}
              className="text-brand-600 underline break-all"
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
