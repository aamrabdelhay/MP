export function UniversityMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "university-mark"}
      viewBox="0 0 72 76"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8.5 66V35.5C8.5 19.5 20.8 7 36 7s27.5 12.5 27.5 28.5V66"
        stroke="#1B4F8A"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15 65V36C15 23.6 24.4 14 36 14s21 9.6 21 22v29"
        stroke="#C9A227"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.78"
      />
      <path d="M16 66h40" stroke="#1B4F8A" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="36" cy="38" rx="18.5" ry="7" stroke="#C9A227" strokeWidth="2.2" />
      <ellipse
        cx="36"
        cy="38"
        rx="18.5"
        ry="7"
        stroke="#E6C75A"
        strokeWidth="1.8"
        transform="rotate(60 36 38)"
      />
      <ellipse
        cx="36"
        cy="38"
        rx="18.5"
        ry="7"
        stroke="#C9A227"
        strokeWidth="1.8"
        transform="rotate(120 36 38)"
      />
      <circle cx="36" cy="38" r="3.3" fill="#E6C75A" />
      <circle cx="53.4" cy="38" r="2.1" fill="#C9A227" />
      <circle cx="27.2" cy="22.6" r="1.8" fill="#E6C75A" />
      <circle cx="27.1" cy="53.3" r="1.8" fill="#C9A227" />
    </svg>
  );
}
