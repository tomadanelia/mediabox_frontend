import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import api from "../../src/lib/axios";
// ─── Asset imports ────────────────────────────────────────────────────────────
import ch_ertsulovneba from "@/assets/1604837920_ertsulovneba.png";
import ch_palitranews  from "@/assets/1604838365_palitranews.png";
import ch_tvpirveli    from "@/assets/1615721265_tvpirveli.png";
import ch_setanta1     from "@/assets/1666527169_setanta-1.png";
import ch_setanta2     from "@/assets/1666527543_setanta-2.png";
import ch_kavkasia     from "@/assets/1668001448_kavkasia-live.png";
import ch_achara       from "@/assets/1668001460_achara-tv.png";
import ch_maestro      from "@/assets/1668001509_maestro-live.png";
import ch_tabula       from "@/assets/1668001523_tabula-live.png";
import ch_rioni        from "@/assets/1668001598_rioni-live.png";
import ch_obieqtivi    from "@/assets/1604837688_obieqtivi.png";
import ch_altinfo      from "@/assets/alt-info.png";
import ch_formula      from "@/assets/formula.jpg";
import ch_imedi        from "@/assets/imedi.png";
import ch_mtavari      from "@/assets/mtavari.png";
import ch_ragbi        from "@/assets/ragbi-tv-live.png";
import ch_rustavi2     from "@/assets/rustavi2.png";
import ch_silk         from "@/assets/silkuniversal.png";
import ch_trialeti     from "@/assets/trialeti.png";
import ch_afxazetis    from "@/assets/1668001809_afxazetis-xma-live.png";
import ch_mega         from "@/assets/1668001400_mega-tv-live.png";
import ch_pirveli      from "@/assets/pirveli-arxi.png";

const ROW1 = [
  { src: ch_ertsulovneba, alt: "Ertsulovneba" },
  { src: ch_palitranews,  alt: "Palitra News"  },
  { src: ch_tvpirveli,   alt: "TV Pirveli"    },
  { src: ch_setanta1,    alt: "Setanta 1"     },
  { src: ch_setanta2,    alt: "Setanta 2"     },
  { src: ch_kavkasia,    alt: "Kavkasia"      },
  { src: ch_achara,      alt: "Achara TV"     },
  { src: ch_maestro,     alt: "Maestro"       },
  { src: ch_tabula,      alt: "Tabula"        },
  { src: ch_rioni,       alt: "Rioni"         },
  { src: ch_obieqtivi,   alt: "Obieqtivi"     },
];

const ROW2 = [
  { src: ch_altinfo,   alt: "Alt-Info"       },
  { src: ch_formula,   alt: "Formula"        },
  { src: ch_imedi,     alt: "Imedi"          },
  { src: ch_mtavari,   alt: "Mtavari"        },
  { src: ch_ragbi,     alt: "Ragbi TV"       },
  { src: ch_rustavi2,  alt: "Rustavi 2"      },
  { src: ch_silk,      alt: "Silk Universal" },
  { src: ch_trialeti,  alt: "Trialeti"       },
  { src: ch_afxazetis, alt: "Afxazetis Xma"  },
  { src: ch_mega,      alt: "Mega TV"        },
  { src: ch_pirveli,   alt: "1TV"            },
];

function repeat(arr, times = 4) {
  return Array.from({ length: times }, () => arr).flat();
}

function MarqueeRow({ channels, direction }) {
  return (
    <div style={s.marqueeTrack}>
      <div style={{
        ...s.marqueeInner,
        animationName: direction === "left" ? "mb-goLeft" : "mb-goRight",
      }}>
        {repeat(channels).map((ch, i) => (
          <div key={i} style={s.chCard}>
            <img src={ch.src} alt={ch.alt} draggable={false} style={s.chImg} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LivePlayer() {
  const [playing, setPlaying]     = useState(true);
  const [progress, setProgress]   = useState(35);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);

  useEffect(() => {
    api.get("/api/channels/22/stream")
      .then(res => setStreamUrl(res.data.url))
      .catch(() => setError("Failed to load stream"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play().catch(() => {});
      });
      return () => { hls.destroy(); };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = streamUrl;
      videoRef.current.play().catch(() => {});
    }
  }, [streamUrl]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }

  function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setProgress(Math.round(Math.max(0, Math.min(100, pct))));
  }

  return (
    <div style={s.root}>

      {/* Animated background */}
      <div style={s.animBg} aria-hidden="true">
        <div style={s.glow} />
      </div>

      {/* Glass player */}
      <section style={s.playerSection}>
        <div style={s.glassPlayer}>
          <Link to="/tv" style={s.playerLink}>
            <div style={s.videoContainer}>
              {loading && (
                <div style={s.videoPlaceholder}>
                  <span style={s.placeholderText}>Loading stream…</span>
                </div>
              )}
              {error && (
                <div style={s.videoPlaceholder}>
                  <span style={{ ...s.placeholderText, color: "#e61c24" }}>{error}</span>
                </div>
              )}
              {!loading && !error && (
                <video ref={videoRef} style={s.videoImg} autoPlay playsInline muted={false} />
              )}
              <div style={s.overlayTop}>
                <div style={s.scoreBadge}>
                  <span>LIVE</span>
                  <span>0 – 1</span>
                  <span style={{ color: "#ccc" }}>BW.</span>
                </div>
                <div style={s.liveIndicator}>
                  <span style={s.liveDot} />
                  LIVE
                </div>
              </div>
              <div style={s.playerControls}>
                <div style={s.progressBar} onClick={handleProgressClick}>
                  <div style={{ ...s.progressFill, width: `${progress}%` }}>
                    <div style={s.progressThumb} />
                  </div>
                </div>
                <div style={s.controlButtons}>
                  <div style={s.leftControls}>
                    <button style={s.ctrlBtn} onClick={togglePlay} aria-label="Play/Pause">
                      {playing ? "⏸" : "▶"}
                    </button>
                    <button style={s.ctrlBtn} aria-label="Rewind">↩</button>
                    <button style={s.ctrlBtn} aria-label="Volume">🔊</button>
                    <span style={s.timeDisplay}>0:00 / 13:35</span>
                  </div>
                  <div style={s.rightControls}>
                    <button style={s.ctrlBtn} aria-label="Captions">CC</button>
                    <button style={s.ctrlBtn} aria-label="Fullscreen">⛶</button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Marquee — outside playerSection, direct child of root */}
      <div style={s.marqueeSection} aria-hidden="true">
        <MarqueeRow channels={ROW1} direction="left"  />
        <MarqueeRow channels={ROW2} direction="right" />
      </div>

      <style>{css}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const RED = "#e61c24";

const s = {
  root: {
    position: "relative",
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    overflowX: "hidden",
    paddingBottom: 60,
    fontFamily: "'Inter', sans-serif",
  },
  animBg: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    background: "#050505",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "-50%", left: "-50%",
    width: "200%", height: "200%",
    background: "radial-gradient(circle at center, rgba(230,28,36,0.15) 0%, transparent 40%)",
    animation: "moveGlow 15s infinite alternate ease-in-out",
  },
  playerSection: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px 60px",
  },
  glassPlayer: {
    width: "100%",
    maxWidth: 1000,
    padding: 28,
    borderRadius: 32,
    background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
    backdropFilter: "blur(40px) saturate(120%)",
    WebkitBackdropFilter: "blur(40px) saturate(120%)",
    borderTop:    "1.5px solid rgba(255,255,255,0.4)",
    borderLeft:   "1.5px solid rgba(255,255,255,0.2)",
    borderBottom: "1.5px solid rgba(255,255,255,0.1)",
    borderRight:  "1.5px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0 0 50px 0 rgba(255,255,255,0.12), 0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.15), inset 0 0 60px rgba(0,0,0,0.2)",
  },
  playerLink: {
    display: "block",
    cursor: "pointer",
    textDecoration: "none",
  },
  videoContainer: {
    borderRadius: 14,
    boxShadow: "0 0 15px rgba(0,0,0,0.5)",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    aspectRatio: "16/9",
  },
  videoPlaceholder: {
    width: "100%", height: "100%",
    background: "#111",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  placeholderText: {
    color: "#555", fontSize: 14, fontWeight: 500,
  },
  videoImg: {
    width: "100%", height: "100%",
    objectFit: "cover",
    opacity: 0.9,
    display: "block",
  },
  overlayTop: {
    position: "absolute",
    top: 20, left: 20, right: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreBadge: {
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(5px)",
    padding: "6px 16px",
    borderRadius: 4,
    fontSize: 13, fontWeight: 600,
    display: "flex", gap: 15,
  },
  liveIndicator: {
    background: RED,
    padding: "4px 12px",
    borderRadius: 4,
    fontSize: 12, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6,
  },
  liveDot: {
    display: "inline-block",
    width: 6, height: 6,
    background: "#fff",
    borderRadius: "50%",
    animation: "pulse 1.5s infinite",
  },
  playerControls: {
    position: "absolute",
    bottom: 0, left: 0,
    width: "100%",
    padding: 20,
    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
    display: "flex", flexDirection: "column", gap: 15,
  },
  progressBar: {
    width: "100%", height: 4,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    cursor: "pointer",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    background: RED,
    borderRadius: 2,
    position: "relative",
    transition: "width 0.1s",
  },
  progressThumb: {
    position: "absolute",
    right: -6, top: -4,
    width: 12, height: 12,
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "0 0 5px rgba(0,0,0,0.5)",
  },
  controlButtons: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  leftControls:  { display: "flex", alignItems: "center", gap: 20 },
  rightControls: { display: "flex", alignItems: "center", gap: 20 },
  ctrlBtn: {
    background: "none", border: "none",
    color: "#fff", fontSize: 16,
    cursor: "pointer", padding: 0, lineHeight: 1,
  },
  timeDisplay: { fontSize: 12, color: "#a0a0a0" },
  marqueeSection: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflow: "hidden",
    maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
  },
  marqueeTrack: {
    width: "100%",
    overflow: "hidden",
  },
  marqueeInner: {
    display: "flex",
    gap: 12,
    width: "max-content",
    willChange: "transform",
    animationDuration: "40s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  chCard: {
    flexShrink: 0,
    width: 130, height: 90,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    pointerEvents: "none",
    userSelect: "none",
  },
  chImg: {
    width: "80%", height: "80%",
    objectFit: "contain",
    display: "block",
  },
};

const css = `
  @keyframes moveGlow {
    0%   { transform: translate(0, 0); }
    50%  { transform: translate(10%, 15%); }
    100% { transform: translate(-10%, 5%); }
  }
  @keyframes pulse {
    0%   { transform: scale(0.95); opacity: 1; }
    50%  { transform: scale(1.2);  opacity: 0.5; }
    100% { transform: scale(0.95); opacity: 1; }
  }
  @keyframes mb-goLeft  { 0% { transform: translateX(0);     } 100% { transform: translateX(-25%); } }
  @keyframes mb-goRight { 0% { transform: translateX(-25%);  } 100% { transform: translateX(0);    } }

  @media (max-width: 768px) {
    .lp-player-section { padding: 20px 10px !important; }
    .lp-glass { padding: 10px !important; border-radius: 16px !important; }
  }
`;