// 手繪風 SVG 圖示集：用不完全對稱的線條、圓角筆觸模擬手繪感，取代原本的 emoji。
// 每個都是簡單的 function component，接受 className 控制大小/顏色（用 currentColor 的部分會跟著文字顏色走）。

function LogoIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.5,18.5 C13.5,8.5 21,7 24,7.2 C27.3,7 34.5,9 33.5,18 C33,25.5 29.5,29.5 25.5,30.8 L22.5,30.6 C18.2,29.3 15,25.8 14.5,18.5 Z"
        fill="#fdead4" stroke="#d4611a" strokeWidth="2" strokeLinejoin="round"
      />
      <path d="M18.5,11 C17.3,17 17.6,24 20.3,29.5" stroke="#d4611a" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M24.2,8.3 C23.9,16 24.3,23.5 24,30.5" stroke="#d4611a" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M29.7,11.2 C31,17 30.5,24 27.9,29.3" stroke="#d4611a" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
      <path d="M20.5,30.5 L18.2,38" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M27.5,30.3 L29.8,38" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="17" y="38" width="14" height="6.5" rx="1.8" fill="#fdead4" stroke="#8d3d19" strokeWidth="1.8" />
    </svg>
  );
}

function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12,2.3 C7.8,2.1 4.6,5.4 4.8,9.4 C5,13.6 9,17.8 12,21.5 C15.2,17.9 19.1,13.5 19.2,9.3 C19.4,5.3 16.1,2.5 12,2.3 Z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
      <circle cx="12" cy="9.4" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function HeartListIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12,20 C6,15.8 2.6,12.3 2.8,8.5 C3,5.3 6.6,3.4 9.2,5.6 C10.3,6.5 11.4,7.9 12,9 C12.7,7.8 13.8,6.4 14.9,5.5 C17.6,3.4 21.1,5.4 21.2,8.6 C21.3,12.4 17.8,16 12,20 Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5,5.3 C4.4,10 4.4,15 4.6,19.4 C9.7,19.6 14.6,19.5 19.5,19.3 C19.6,14.7 19.6,10 19.4,5.4 C14.4,5.2 9.5,5.2 4.5,5.3 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8,3.5 L8,7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.2,3.5 L16.2,7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.6,9.6 C9.5,9.4 14.5,9.4 19.4,9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.3,13 L8.4,13.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.1,13 L12.2,13.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.8,13 L15.9,13.1" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8.3,16.2 L8.4,16.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.1,16.2 L12.2,16.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.3,8.2 C10.1,7.9 13.9,7.9 17.7,8.2 C18.2,12.3 18.4,16 17.9,20.2 C13.9,20.6 10,20.6 6.1,20.2 C5.6,16 5.8,12.3 6.3,8.2 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9,8.4 C8.7,5.6 10,3.4 12,3.4 C14,3.4 15.4,5.5 15,8.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6,3.6 C10,3.4 14,3.4 18,3.6 C18.2,9.6 18.1,15.5 18,20.6 L16,19.2 L14,20.6 L12,19.2 L10,20.6 L8,19.2 L6,20.6 C5.9,15 5.9,9.4 6,3.6 Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
      <path d="M8.4,8 L15.6,7.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.4,11.3 L15.6,11.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.4,14.6 L13,14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CompassIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.2,2.8 C18,2.6 21.5,7 21.2,12.3 C21,17.6 16.8,21.4 11.8,21.2 C6.7,21 2.7,17 2.8,11.8 C2.9,6.8 6.8,3 12.2,2.8 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15.3,8.5 L13,13 L9,15.3 L11.2,10.8 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5.3" y="10.4" width="13.4" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8,10.2 C7.7,6.6 9.5,4.3 12,4.3 C14.5,4.3 16.4,6.5 16,10.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8.2" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5,19.5 C3.7,15.8 6,13.6 9,13.6 C12,13.6 14.2,15.8 14.5,19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16.3" cy="8.8" r="2.3" stroke="currentColor" strokeWidth="1.5" opacity="0.75" />
      <path d="M14.8,19.2 C15,16.4 16.5,14.7 18.5,14.7 C20.5,14.7 21.9,16.3 22.1,19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

function GlobeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.2,2.8 C18,2.6 21.5,7 21.2,12.3 C21,17.6 16.8,21.4 11.8,21.2 C6.7,21 2.7,17 2.8,11.8 C2.9,6.8 6.8,3 12.2,2.8 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3,12 C8,12.6 16,12.6 21,12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12,2.9 C9.3,6.5 8,9 8.1,12 C8.2,15 9.5,17.7 12,21.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12,2.9 C14.7,6.5 16,9 15.9,12 C15.8,15 14.5,17.7 12,21.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,6.6 C8,6.2 15,6.9 20,6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4,12.2 C9,12.7 15,11.7 20,12.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4,17.7 C8,17.2 14,18 20,17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5,19.6 L5.2,15.3 C10,10.4 14,6.4 16.4,4.2 C17.2,3.6 18.3,3.7 19,4.5 C19.7,5.3 19.7,6.4 19,7.1 C16.6,9.6 12.6,13.6 8.6,18.6 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.2,6.8 L17.3,9.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
