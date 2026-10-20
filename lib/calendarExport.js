// 行前任務的「加入行事曆」功能（R4）：刻意不做伺服器推播，把提醒交給手機本身的行事曆 App，
// 零成本、零後端、而且比我們自己發通知可靠很多。

// 把某個 IANA 時區（例如 "Asia/Tokyo"）的某個時間點，換算成正確的 UTC 時間。
// 用 Intl.DateTimeFormat 反推時區偏移，含日光節約時間也能算對。
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(guess);
  const map = {};
  parts.forEach(function (p) { if (p.type !== "literal") map[p.type] = p.value; });
  const hourVal = Number(map.hour) === 24 ? 0 : Number(map.hour);
  const asIfUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), hourVal, Number(map.minute), Number(map.second));
  const diff = guess.getTime() - asIfUtc;
  return new Date(guess.getTime() + diff);
}

// 把 UTC 時間轉成「台灣時間」字串，給畫面顯示用（這個 App 的使用者預設是台灣時間）
function formatAsTaiwanTime(utcDate) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(utcDate);
}

function pad2(n) { return String(n).padStart(2, "0"); }

function toIcsUtcStamp(date) {
  return (
    date.getUTCFullYear() + pad2(date.getUTCMonth() + 1) + pad2(date.getUTCDate()) +
    "T" + pad2(date.getUTCHours()) + pad2(date.getUTCMinutes()) + pad2(date.getUTCSeconds()) + "Z"
  );
}

function icsEscape(text) {
  return String(text || "").replace(/[\\;,]/g, function (c) { return "\\" + c; }).replace(/\n/g, "\\n");
}

// task 需要的欄位：title, deadlineAt (YYYY-MM-DD)，選填 openTime + timezone（有的話當成精確時間事件，
// 沒有的話當成全天事件，用 deadlineAt 當天）、description、bookingUrl
function buildIcsEvent(task) {
  const uid = (task.id || task.title) + "@zoula-app";
  let dtstartLine, dtendLine, alarms;

  if (task.openTime && task.timezone) {
    const start = zonedTimeToUtc(task.deadlineAt, task.openTime, task.timezone);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    dtstartLine = "DTSTART:" + toIcsUtcStamp(start);
    dtendLine = "DTEND:" + toIcsUtcStamp(end);
    alarms =
      "BEGIN:VALARM\nTRIGGER:-P1D\nACTION:DISPLAY\nDESCRIPTION:" + icsEscape(task.title) + "\nEND:VALARM\n" +
      "BEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nDESCRIPTION:" + icsEscape(task.title) + "\nEND:VALARM\n";
  } else {
    const ymd = task.deadlineAt.replace(/-/g, "");
    const nextDay = addDays(task.deadlineAt, 1).replace(/-/g, "");
    dtstartLine = "DTSTART;VALUE=DATE:" + ymd;
    dtendLine = "DTEND;VALUE=DATE:" + nextDay;
    alarms = "BEGIN:VALARM\nTRIGGER:-P1D\nACTION:DISPLAY\nDESCRIPTION:" + icsEscape(task.title) + "\nEND:VALARM\n";
  }

  const descriptionParts = [];
  if (task.notes) descriptionParts.push(task.notes);
  if (task.bookingUrl) descriptionParts.push("連結：" + task.bookingUrl);
  descriptionParts.push("在 ZouLa App 查看完整任務清單");

  return (
    "BEGIN:VEVENT\n" +
    "UID:" + icsEscape(uid) + "\n" +
    dtstartLine + "\n" +
    dtendLine + "\n" +
    "SUMMARY:" + icsEscape("ZouLa：" + task.title) + "\n" +
    "DESCRIPTION:" + icsEscape(descriptionParts.join("\\n")) + "\n" +
    (task.bookingUrl ? "URL:" + icsEscape(task.bookingUrl) + "\n" : "") +
    alarms +
    "END:VEVENT\n"
  );
}

function buildIcsContent(tasks) {
  return (
    "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ZouLa//PrepTasks//ZH-TW\nCALSCALE:GREGORIAN\n" +
    tasks.map(buildIcsEvent).join("") +
    "END:VCALENDAR\n"
  );
}

function downloadIcsFile(filename, tasks) {
  const content = buildIcsContent(tasks);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : filename + ".ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

function buildGoogleCalendarUrl(task) {
  let datesParam;
  if (task.openTime && task.timezone) {
    const start = zonedTimeToUtc(task.deadlineAt, task.openTime, task.timezone);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    datesParam = toIcsUtcStamp(start) + "/" + toIcsUtcStamp(end);
  } else {
    const ymd = task.deadlineAt.replace(/-/g, "");
    const nextDay = addDays(task.deadlineAt, 1).replace(/-/g, "");
    datesParam = ymd + "/" + nextDay;
  }
  const detailsParts = [];
  if (task.notes) detailsParts.push(task.notes);
  if (task.bookingUrl) detailsParts.push(task.bookingUrl);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "ZouLa：" + task.title,
    dates: datesParam,
    details: detailsParts.join("\n"),
  });
  return "https://www.google.com/calendar/render?" + params.toString();
}
