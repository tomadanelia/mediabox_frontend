import { useState } from "react";

export function Equalizer() {
  const bars = [
    { delay: 1.0, duration: 1.56, scale: 0.8 },
    { delay: 0.6, duration: 1.24, scale: 0.4 },
    { delay: 0.3, duration: 1.52, scale: 1.0 },
    { delay: 0.7, duration: 1.36, scale: 0.6 },
    { delay: 0.45, duration: 1.18, scale: 0.25 },
  ];

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
      {bars.map(({ delay, duration, scale }, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: "60%",
            borderRadius: 3,
            backgroundColor: "#fb923c",
            transform: `scaleY(${scale})`,
            animation: `eq-wave ${duration}s ease-in-out ${-delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes eq-wave {
          0%   { transform: scaleY(0.1); }
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


export function NeonStar({ size = 40 }: { size?: number }) {
  const [saved, setSaved] = useState(false);
  const [flicker, setFlicker] = useState(false);

  const handleClick = () => {
    if (!saved) {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 500);
    }
    setSaved(s => !s);
  };

  return (
    <button
      onClick={handleClick}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          filter: saved
            ? "drop-shadow(0 0 4px #4ade80) drop-shadow(0 0 10px #4ade8088)"
            : "none",
          animation: flicker ? "neon-flicker 0.5s steps(1) forwards" : "none",
          transition: "filter 0.4s",
        }}
      >
        <polygon
          points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill={saved ? "#ffff0045" : "none"}
          stroke={saved ? "#fde047" : "#71717a"}
          strokeWidth="1.5"
          style={{ transition: "all 0.3s" }}
        />
      </svg>
      <style>{`
        @keyframes neon-flicker {
          100% { opacity: 1; }
        }
      `}</style>
    </button>
  );
}