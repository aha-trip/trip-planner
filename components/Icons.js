// 手繪風 SVG 圖示集：用不完全對稱的線條、圓角筆觸模擬手繪感，取代原本的 emoji。
// 每個都是簡單的 function component，接受 className 控制大小/顏色（用 currentColor 的部分會跟著文字顏色走）。

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

function MoreIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="12" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <circle cx="19" cy="12" r="1.9" fill="currentColor" />
    </svg>
  );
}

function LinkIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.6,14.3 C7.8,16 5.9,17.6 7.9,19.6 C9.8,21.5 11.5,19.9 13.2,18.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.4,9.6 C16.2,7.9 18,6.3 16,4.3 C14.1,2.4 12.4,4 10.7,5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9,15.1 L15,8.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5,12.2 C4.2,7.6 8,3.8 12.5,4 C16.1,4.2 19.1,6.9 19.7,10.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.4,6.9 L19.8,10.3 L22.6,6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5,11.8 C19.8,16.4 16,20.2 11.5,20 C7.9,19.8 4.9,17.1 4.3,13.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.6,17.1 L4.2,13.7 L1.4,17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloudIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.2,18.4 C4.4,18.3 2.4,16.1 2.6,13.5 C2.8,11.2 4.8,9.6 7,9.8 C7.4,6.7 10,4.4 13.1,4.6 C16.1,4.8 18.4,7.3 18.3,10.2 C20.4,10.5 21.8,12.2 21.5,14.2 C21.2,16.3 19.2,18 17,18.3 C13.8,18.6 10.3,18.5 7.2,18.4 Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.2,2.8 C18,2.6 21.5,7 21.2,12.3 C21,17.6 16.8,21.4 11.8,21.2 C6.7,21 2.7,17 2.8,11.8 C2.9,6.8 6.8,3 12.2,2.8 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7.8,12.2 L10.5,15 L16.3,8.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12,3.2 L12.9,6 M12,20.8 L11.1,18 M20.8,12 L18,11.1 M3.2,12 L6,12.9 M18.4,5.6 L16.3,7.7 M5.6,18.4 L7.7,16.3 M18.4,18.4 L16.3,16.3 M5.6,5.6 L7.7,7.7"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
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

function PlaneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.3,3.3 C11.8,2.9 12.5,2.9 13,3.4 C13.5,3.9 13.6,4.6 13.3,5.5 L11.8,10 L18.4,13.7 C19.4,14.3 19.8,15 19.6,15.7 C19.4,16.3 18.7,16.5 17.6,16.2 L11,14.2 L9.5,18.4 L11.8,20 C12.2,20.3 12.3,20.7 12,21 C11.7,21.3 11.2,21.4 10.6,21.1 L7.8,19.7 L5.2,20.8 C4.6,21 4.2,20.9 4.1,20.5 C4,20.2 4.2,19.8 4.7,19.4 L6.8,17.6 L5.9,14.6 C5.7,14 5.8,13.5 6.2,13.3 C6.5,13.1 6.9,13.2 7.2,13.6 L9.1,15.6 L12.9,13.1 L7.4,9 C6.5,8.3 6.3,7.6 6.7,7.1 C7.1,6.6 7.9,6.6 8.9,7.2 L14.9,10.7 L11.3,3.3 Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08"
      />
    </svg>
  );
}

function BuildingIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.3,21 L6.3,5.5 C6.3,4.3 7,3.5 8.2,3.4 L15.6,3.3 C16.8,3.3 17.6,4.1 17.6,5.4 L17.7,21" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5,21 L20.5,21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.3,7 L9.3,7.1 M14.6,7 L14.6,7.1 M9.3,11 L9.3,11.1 M14.6,11 L14.6,11.1 M9.3,15 L9.3,15.1 M14.6,15 L14.6,15.1" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M10.3,21 L10.3,17.3 C10.3,16.6 10.8,16.1 11.6,16.1 L12.4,16.1 C13.2,16.1 13.7,16.6 13.7,17.3 L13.7,21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function TicketIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5,9.2 C3.4,8 4.2,7.2 5.4,7.2 L18.5,7.1 C19.7,7.1 20.5,7.9 20.5,9.1 C19.3,9.3 18.5,10.1 18.5,11.2 C18.5,12.3 19.3,13.1 20.5,13.3 C20.5,14.5 19.7,15.3 18.5,15.3 L5.4,15.4 C4.2,15.4 3.4,14.6 3.4,13.4 C4.6,13.2 5.4,12.4 5.4,11.3 C5.4,10.2 4.6,9.4 3.5,9.2 Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
      <path d="M11,8.3 L11,14.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.5 2.2" />
    </svg>
  );
}

function TrainIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6,13.3 C5.8,9.9 6.1,6.7 7,4.9 C7.9,3.3 9.6,2.9 12,2.9 C14.4,2.9 16.1,3.4 17,4.9 C17.9,6.6 18.2,9.9 18,13.3 C18,15.8 16.1,17.5 12,17.5 C7.9,17.5 6,15.8 6,13.3 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6.3,9.6 L17.7,9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="13.2" r="1" fill="currentColor" />
      <circle cx="15" cy="13.2" r="1" fill="currentColor" />
      <path d="M8.5,17.8 L6,21.2 M15.5,17.8 L18,21.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5,17.5 L4.5,13.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9.5,17.5 L9.5,11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.5,17.5 L14.5,8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.5,17.5 L19.6,4.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function PassportIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5.5" y="3" width="13" height="18" rx="1.8" stroke="currentColor" strokeWidth="1.7" transform="rotate(-2 12 12)" />
      <circle cx="12" cy="10.2" r="2.6" stroke="currentColor" strokeWidth="1.4" transform="rotate(-2 12 12)" />
      <path d="M8.5,16.3 C9.8,15.5 14.1,15.5 15.4,16.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" transform="rotate(-2 12 12)" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,2.8 L19.3,5.5 C19.5,11.4 18,17.3 12,21.2 C6,17.3 4.5,11.4 4.7,5.5 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.6,11.8 L10.8,14.2 L15.6,9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.2,3.5 L13.8,3.4 L18,7.7 L17.9,20.5 L6.1,20.6 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13.7,3.5 L13.8,7.8 L17.9,7.7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5,12 L15.4,11.9 M8.5,15.2 L15.4,15.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CoinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.1,2.8 C18,2.6 21.5,7 21.2,12.3 C21,17.6 16.8,21.4 11.8,21.2 C6.7,21 2.7,17 2.8,11.8 C2.9,6.8 6.8,3 12.1,2.8 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12,7.3 L12,16.7 M9.6,9.2 C9.6,7.9 10.6,7.2 12,7.2 C13.4,7.2 14.3,7.9 14.3,8.8 C14.3,11 9.6,10.4 9.6,12.8 C9.6,13.8 10.6,14.5 12,14.5 C13.4,14.5 14.4,13.8 14.4,12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.6,6.4 L9.4,4.5 C9.6,4 10.1,3.7 10.7,3.7 L13.4,3.7 C14,3.7 14.5,4 14.7,4.5 L15.4,6.4 L18.3,6.4 C19.4,6.4 20.2,7.2 20.2,8.3 L20.2,17 C20.2,18.1 19.4,18.9 18.3,18.9 L5.7,18.9 C4.6,18.9 3.8,18.1 3.8,17 L3.8,8.3 C3.8,7.2 4.6,6.4 5.7,6.4 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12.4" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.3,14.8 L5.3,9.8 C5.6,8.6 6.5,7.9 7.8,7.8 L16.2,7.8 C17.5,7.9 18.4,8.6 18.7,9.8 L19.7,14.8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.3,14.7 L20.7,14.7 C21.3,14.7 21.6,15 21.6,15.6 L21.6,17.8 C21.6,18.3 21.2,18.6 20.7,18.6 L19,18.6 L19,20.2 C19,20.7 18.6,21 18.1,21 L16.9,21 C16.4,21 16,20.7 16,20.2 L16,18.6 L8,18.6 L8,20.2 C8,20.7 7.6,21 7.1,21 L5.9,21 C5.4,21 5,20.7 5,20.2 L5,18.6 L3.3,18.6 C2.8,18.6 2.4,18.3 2.4,17.8 L2.4,15.6 C2.4,15 2.7,14.7 3.3,14.7 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="16.6" r="1.1" fill="currentColor" />
      <circle cx="17" cy="16.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.4,4.1 C11.1,2.9 12.9,2.9 13.6,4.1 L20.9,17.2 C21.6,18.4 20.7,19.9 19.3,19.9 L4.7,19.9 C3.3,19.9 2.4,18.4 3.1,17.2 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12,9.3 L12,13.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12,16.3 L12,16.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function HourglassIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5,3.6 L17.5,3.5 M6.5,20.5 L17.5,20.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7,3.8 C6.9,7.7 8.5,10 12,12 C15.5,10.1 17.1,7.8 17,3.9 M7,20.2 C6.9,16.3 8.5,14 12,12 C15.5,13.9 17.1,16.2 17,20.1" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function HandRaisedIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9,21 C6.8,20.5 5.8,19 5.2,16.8 L3.6,11.6 C3.3,10.6 3.8,9.8 4.7,9.7 C5.5,9.6 6.1,10.1 6.5,11 L7.8,13.7 L7.8,5.3 C7.8,4.3 8.4,3.6 9.3,3.6 C10.2,3.6 10.8,4.3 10.8,5.3 L10.8,10.5 C11.1,10.3 11.5,10.2 11.9,10.2 C12.7,10.2 13.3,10.7 13.5,11.4 C13.8,11 14.3,10.7 14.9,10.7 C15.7,10.7 16.3,11.2 16.6,12 C16.9,11.7 17.3,11.5 17.8,11.5 C18.7,11.5 19.4,12.2 19.4,13.2 L19.4,16.3 C19.4,19.2 17.4,21 14.5,21 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  );
}

function FlaskIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.8,3.5 L9.8,9.8 L4.8,18.5 C4.2,19.5 4.9,20.7 6.1,20.7 L17.9,20.7 C19.1,20.7 19.8,19.5 19.2,18.5 L14.2,9.8 L14.2,3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.8,3.5 L15.2,3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.5,15 C9.3,13.9 14.5,13.9 16.4,15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.5,7.3 C3.4,6.1 4.1,5.4 5.3,5.4 L9.6,5.4 L11.2,7.3 L18.6,7.3 C19.7,7.3 20.4,8 20.4,9.1 L20.3,17.8 C20.3,18.9 19.6,19.6 18.5,19.6 L5.4,19.6 C4.3,19.6 3.6,18.9 3.6,17.8 Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.8,12 C5,7.5 8.3,5.3 12,5.3 C15.7,5.3 19,7.5 21.2,12 C19,16.5 15.7,18.7 12,18.7 C8.3,18.7 5,16.5 2.8,12 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LightningIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.2,2.6 L6.4,13.4 L11,13.2 L10.1,21.4 L17.8,10 L12.9,10.2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

// 保管箱分類 -> 圖示的對照表。放在這裡（而不是 lib/vaultCategories.js）是為了閃開載入順序問題，
// 見 lib/vaultCategories.js 開頭的說明。
const VAULT_CATEGORY_ICON_MAP = {
  flight: PlaneIcon,
  stay: BuildingIcon,
  ticket: TicketIcon,
  transit: TrainIcon,
  esim: SignalIcon,
  entry: PassportIcon,
  insurance: ShieldIcon,
  other: DocumentIcon,
};

function vaultCategoryIconComponent(key) {
  return VAULT_CATEGORY_ICON_MAP[key] || DocumentIcon;
}

function WeatherIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="7.3" r="3.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8,2.2 L8,3.4 M3.4,7.3 L4.6,7.3 M4.4,3.5 L5.3,4.4 M12,3.6 L11.1,4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M8.5,13.2 C5.9,13.1 4.1,15 4.3,17.3 C4.4,18.8 5.7,19.9 7.5,19.9 L16.3,19.9 C18.5,19.9 20,18.4 19.8,16.5 C19.6,14.8 18.1,13.6 16.2,13.8 C15.9,11.6 14,10.1 11.8,10.4 C10,10.6 8.7,11.8 8.5,13.2 Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
    </svg>
  );
}

function CrownIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4,18.5 L3.2,9.3 L7.5,12.5 L11.9,5.3 L12.2,5.3 L16.6,12.6 L20.8,9.3 L20,18.5 C15.3,19.1 8.7,19.1 4,18.5 Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1"
      />
    </svg>
  );
}

function OfflineIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6,9.5 C7.5,8 9.6,7.1 12,7.1 C14.4,7.1 16.5,8 18,9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <path d="M8.5,12.3 C9.5,11.4 10.7,10.9 12,10.9 C13.3,10.9 14.5,11.4 15.5,12.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <path d="M11.4,15.6 L12.6,15.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M3.5,3.6 L20.5,20.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
