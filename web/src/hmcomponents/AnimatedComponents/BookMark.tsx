import { useState } from "react";

interface MagneticSnapProps {
  channelId: string;
  isFav: boolean;
  markFavorite: (channelId: number) => void;
  unmarkFavorite: (channelId: number) => void;
}

export function MagneticSnap({ channelId, isFav, markFavorite, unmarkFavorite }: MagneticSnapProps) {
  const [snap, setSnap] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection
    
    setSnap(true);

if (isFav) {
  unmarkFavorite(Number(channelId));
} else {
  markFavorite(Number(channelId));
}
    
    setTimeout(() => { 
      setSnap(false); 
    }, 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-6 h-6 flex items-center justify-center rounded border transition-colors duration-300 cursor-pointer
        ${isFav
          ? "border-amber-500 bg-amber-500/10"
          : "border-zinc-700 bg-transparent hover:border-zinc-500"
        }`}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        style={{
          animation: snap ? "mag-snap 0.3s cubic-bezier(0.4,0,0.2,1)" : "none",
          filter: snap ? "brightness(1.6)" : "none",
          transition: "filter 0.2s",
        }}
      >
        <path
          d="M5 3h14a1 1 0 011 1v17l-8-4-8 4V4a1 1 0 011-1z"
          fill={isFav ? "#f59e0b" : "none"}
          stroke={isFav ? "#f59e0b" : "#71717a"}
          strokeWidth="1.5"
          style={{ transition: "all 0.3s" }}
        />
      </svg>
      <style>{`
        @keyframes mag-snap {
          0%   { transform: scale(0.75); opacity: 0.5; }
          60%  { transform: scale(1.12); opacity: 1; }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
      `}</style>
    </button>
  );
}