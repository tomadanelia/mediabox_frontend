export function Equalizer() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: 40,
      height: 40,
      padding: 6,
      gap: 2,
    }}>
      {[1.0, 0.6, 0.3, 0.7, 0.45].map((delay, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "60%",
            borderRadius: 3,
            backgroundColor: "#fb923c",
            animation: `eq-wave ${1.4 + delay * 0.4}s ease-in-out ${-delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-wave {
          0%   { transform: scaleY(0.15); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
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
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* track */}
        <circle cx="40" cy="40" r="28" fill="none" stroke="#312e81" strokeWidth="2" />

        {/* comet arc */}
        <circle
          cx="40" cy="40" r="28"
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