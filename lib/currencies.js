// 常見旅遊幣別（沒有連匯率 API，只是方便輸入時搜尋幣別代碼，不做匯率換算）
const CURRENCIES = [
  { code: "TWD", label: "新台幣 TWD" },
  { code: "THB", label: "泰銖 THB" },
  { code: "JPY", label: "日圓 JPY" },
  { code: "KRW", label: "韓元 KRW" },
  { code: "USD", label: "美金 USD" },
  { code: "CNY", label: "人民幣 CNY" },
  { code: "HKD", label: "港幣 HKD" },
  { code: "MOP", label: "澳門幣 MOP" },
  { code: "SGD", label: "新加坡幣 SGD" },
  { code: "MYR", label: "馬來幣 MYR" },
  { code: "VND", label: "越南盾 VND" },
  { code: "IDR", label: "印尼盾 IDR" },
  { code: "PHP", label: "菲律賓披索 PHP" },
  { code: "INR", label: "印度盧比 INR" },
  { code: "EUR", label: "歐元 EUR" },
  { code: "GBP", label: "英鎊 GBP" },
  { code: "AUD", label: "澳幣 AUD" },
  { code: "NZD", label: "紐西蘭幣 NZD" },
  { code: "CAD", label: "加幣 CAD" },
  { code: "CHF", label: "瑞士法郎 CHF" },
  { code: "AED", label: "阿聯酋迪拉姆 AED" },
  { code: "TRY", label: "土耳其里拉 TRY" },
];

function findCurrency(code) {
  return CURRENCIES.find(function (c) { return c.code === code; }) || { code: code, label: code };
}

function searchCurrencies(keyword) {
  const k = (keyword || "").trim().toLowerCase();
  if (!k) return CURRENCIES;
  return CURRENCIES.filter(function (c) {
    return c.code.toLowerCase().indexOf(k) >= 0 || c.label.toLowerCase().indexOf(k) >= 0;
  });
}
