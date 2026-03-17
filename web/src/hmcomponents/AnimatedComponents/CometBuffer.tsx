export function CometRing() {
  return (
    <div style={{ width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <filter id="comet-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="comet-tail" gradientUnits="userSpaceOnUse" x1="40" y1="12" x2="40" y2="68">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#d52b1e" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(213,43,30,0.18)" strokeWidth="5" />

        <circle
          cx="40" cy="40" r="32"
          fill="none"
          stroke="url(#comet-tail)"
          strokeWidth="3"
          strokeDasharray="60 116"
          strokeLinecap="round"
          filter="url(#comet-glow)"
          style={{ animation: "comet-spin 1s cubic-bezier(.4,0,.2,1) infinite", transformOrigin: "40px 40px" }}
        />

        <style>{`
          @keyframes comet-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </svg>
    </div>
  );
}