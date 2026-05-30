/** Фирменная иллюстрация для hero /legal — оригинальная, без копирования сторонних площадок */
export function LegalHubIllustration({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      role="presentation"
    >
      <svg viewBox="0 0 400 320" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="legal-hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--nashlo-orange))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--nashlo-orange))" stopOpacity="0.04" />
          </linearGradient>
          <filter id="legal-hero-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <ellipse cx="200" cy="280" rx="160" ry="24" fill="#0f172a" fillOpacity="0.06" />

        <circle cx="200" cy="140" r="100" fill="url(#legal-hero-grad)" />
        <circle cx="200" cy="140" r="72" fill="white" fillOpacity="0.85" />

        <g filter="url(#legal-hero-shadow)">
          <rect x="72" y="88" width="88" height="56" rx="14" fill="white" stroke="hsl(var(--nashlo-orange))" strokeOpacity="0.25" strokeWidth="1.5" />
          <rect x="82" y="100" width="48" height="6" rx="3" fill="hsl(var(--nashlo-orange))" fillOpacity="0.35" />
          <rect x="82" y="112" width="64" height="4" rx="2" fill="#e4e4e7" />
          <rect x="82" y="122" width="52" height="4" rx="2" fill="#e4e4e7" />
          <circle cx="142" cy="116" r="10" fill="hsl(var(--nashlo-orange))" fillOpacity="0.15" />
          <path d="M138 116h8M142 112v8" stroke="hsl(var(--nashlo-orange))" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <g filter="url(#legal-hero-shadow)">
          <rect x="240" y="72" width="88" height="56" rx="14" fill="white" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="252" y="84" width="40" height="32" rx="6" fill="hsl(var(--nashlo-orange))" fillOpacity="0.12" />
          <rect x="298" y="90" width="20" height="4" rx="2" fill="#d4d4d8" />
          <rect x="298" y="100" width="16" height="4" rx="2" fill="#e4e4e7" />
          <rect x="298" y="110" width="22" height="4" rx="2" fill="#e4e4e7" />
        </g>

        <g filter="url(#legal-hero-shadow)">
          <rect x="148" y="168" width="104" height="64" rx="16" fill="white" stroke="hsl(var(--nashlo-orange))" strokeOpacity="0.2" strokeWidth="1.5" />
          <circle cx="172" cy="200" r="14" fill="hsl(var(--nashlo-orange))" fillOpacity="0.2" />
          <path
            d="M168 200l3 3 6-7"
            stroke="hsl(var(--nashlo-orange))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="194" y="188" width="48" height="5" rx="2.5" fill="#d4d4d8" />
          <rect x="194" y="200" width="56" height="4" rx="2" fill="#e4e4e7" />
          <rect x="194" y="210" width="40" height="4" rx="2" fill="#e4e4e7" />
        </g>

        <circle cx="118" cy="168" r="6" fill="hsl(var(--nashlo-orange))" fillOpacity="0.5" />
        <circle cx="290" cy="152" r="5" fill="hsl(var(--nashlo-orange))" fillOpacity="0.35" />
        <circle cx="310" cy="200" r="4" fill="hsl(var(--nashlo-orange))" fillOpacity="0.25" />
        <circle cx="96" cy="128" r="4" fill="#a1a1aa" fillOpacity="0.4" />
      </svg>
    </div>
  )
}
