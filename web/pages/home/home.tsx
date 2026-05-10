import React, { useEffect, useRef } from "react";
import useUIStore from "@/store/ui-store";
import Footer from "@/hmcomponents/footer";

// Channel image imports — Row 1
import ch_ertsulovneba   from "@/assets/1604837920_ertsulovneba.png";
import ch_palitranews    from "@/assets/1604838365_palitranews.png";
import ch_tvpirveli      from "@/assets/1615721265_tvpirveli.png";
import ch_setanta1       from "@/assets/1666527169_setanta-1.png";
import ch_setanta2       from "@/assets/1666527543_setanta-2.png";
import ch_kavkasia       from "@/assets/1668001448_kavkasia-live.png";
import ch_achara         from "@/assets/1668001460_achara-tv.png";
import ch_maestro        from "@/assets/1668001509_maestro-live.png";
import ch_tabula         from "@/assets/1668001523_tabula-live.png";
import ch_rioni          from "@/assets/1668001598_rioni-live.png";
import ch_obieqtivi      from "@/assets/1604837688_obieqtivi.png";

// Channel image imports — Row 2
import ch_altinfo        from "@/assets/alt-info.png";
import ch_formula        from "@/assets/formula.jpg";
import ch_imedi          from "@/assets/imedi.png";
import ch_mtavari        from "@/assets/mtavari.png";
import ch_ragbi          from "@/assets/ragbi-tv-live.png";
import ch_rustavi2       from "@/assets/rustavi2.png";
import ch_silk           from "@/assets/silkuniversal.png";
import ch_trialeti       from "@/assets/trialeti.png";
import ch_afxazetis      from "@/assets/1668001809_afxazetis-xma-live.png";
import ch_mega           from "@/assets/1668001400_mega-tv-live.png";
import ch_pirveli        from "@/assets/pirveli-arxi.png";

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
  { src: ch_altinfo,   alt: "Alt-Info"      },
  { src: ch_formula,   alt: "Formula"       },
  { src: ch_imedi,     alt: "Imedi"         },
  { src: ch_mtavari,   alt: "Mtavari"       },
  { src: ch_ragbi,     alt: "Ragbi TV"      },
  { src: ch_rustavi2,  alt: "Rustavi 2"     },
  { src: ch_silk,      alt: "Silk Universal"},
  { src: ch_trialeti,  alt: "Trialeti"      },
  { src: ch_afxazetis, alt: "Afxazetis Xma" },
  { src: ch_mega,      alt: "Mega TV"       },
  { src: ch_pirveli,   alt: "1TV"           },
];

// Repeat array 4× for seamless marquee
function repeat<T>(arr: T[], times = 4): T[] {
  return Array.from({ length: times }, () => arr).flat();
}

interface MarqueeRowProps {
  channels: { src: string; alt: string }[];
  direction: "left" | "right";
}

const MarqueeRow: React.FC<MarqueeRowProps> = ({ channels, direction }) => (
  <div className="mb-marquee-track">
    <div className={`mb-marquee-inner ${direction === "left" ? "go-left" : "go-right"}`}>
      {repeat(channels).map((ch, i) => (
        <div key={i} className="mb-ch">
          <img src={ch.src} alt={ch.alt} draggable={false} />
        </div>
      ))}
    </div>
  </div>
);

const Home: React.FC = () => {
  const currentLogo = useUIStore((state) => state.logoLight);

  return (
    <>
    <div className="mb-root">
      {/* ── Animated background ── */}
      <div className="mb-bg" aria-hidden="true">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <filter id="hg" filterUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="2000">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="over" />
            </filter>
            <filter id="sg" filterUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="2000">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feComposite in="SourceGraphic" in2="b" operator="over" />
            </filter>
          </defs>
          <path fill="none" stroke="#ff4d1a" strokeWidth="4" opacity="0.75" filter="url(#hg)">
            <animate attributeName="d" dur="15s" repeatCount="indefinite"
              values="M-200,400 C200,100 400,700 800,400 S1200,100 1400,400;M-200,400 C200,700 400,100 800,400 S1200,700 1400,400;M-200,400 C200,100 400,700 800,400 S1200,100 1400,400" />
          </path>
          <path fill="none" stroke="#c44536" strokeWidth="5" opacity="0.65" filter="url(#sg)">
            <animate attributeName="d" dur="20s" repeatCount="indefinite"
              values="M-200,600 C100,800 500,200 700,600 S1100,800 1400,600;M-200,600 C100,200 500,800 700,600 S1100,200 1400,600;M-200,600 C100,800 500,200 700,600 S1100,800 1400,600" />
          </path>
          <path fill="none" stroke="#ff4d1a" strokeWidth="2" opacity="0.4">
            <animate attributeName="d" dur="12s" repeatCount="indefinite"
              values="M-200,500 C300,200 400,900 800,500 S1100,200 1400,500;M-200,500 C300,900 400,200 800,500 S1100,900 1400,500;M-200,500 C300,200 400,900 800,500 S1100,200 1400,500" />
          </path>
          <path fill="none" stroke="#c44536" strokeWidth="3" opacity="0.5" filter="url(#hg)">
            <animate attributeName="d" dur="18s" repeatCount="indefinite"
              values="M-200,300 C200,500 500,100 900,300 S1200,500 1400,300;M-200,300 C200,100 500,500 900,300 S1200,100 1400,300;M-200,300 C200,500 500,100 900,300 S1200,500 1400,300" />
          </path>
        </svg>
        <div className="mb-fog" />
      </div>

      {/* ── Panel ── */}
      <div className="mb-panel">

        {/* ── Main content ── */}
        <div className="mb-content">

          {/* Hero */}
          <div className="mb-hero">
            <div className="mb-hero-logo">
              <img
                src={currentLogo}
                alt="Mediabox"
                style={{ height: "clamp(3rem, 8vw, 5.5rem)", width: "auto", objectFit: "contain" }}
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              />
            </div>
            <p className="mb-hero-sub">
              ყველა მნიშვნელოვანი არხი და სპორტული მოვლენა ერთ სივრცეში.
            </p>
            <a href="/tv" className="mb-watch-btn">
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>play_circle</span>
              პირდაპირი
            </a>
          </div>

          {/* Channel marquee */}
          <div className="mb-marquee-section" aria-hidden="true">
            <MarqueeRow channels={ROW1} direction="left"  />
            <MarqueeRow channels={ROW2} direction="right" />
          </div>

        </div>

        {/* ── Footer ── */}
        <footer className="mb-footer">
          <div className="mb-footer-left">
            &copy; {new Date().getFullYear()} Mediabox. All rights reserved.
          </div>
          <div className="mb-footer-links">
            <a href="/support">Privacy Policy</a>
            <a href="/support">Terms of Service</a>
            <a href="/support">Contact Support</a>
          </div>
          <div className="mb-footer-socials">
            <button aria-label="Share">
              <span className="material-symbols-outlined">share</span>
            </button>
            <button aria-label="Email">
              <span className="material-symbols-outlined">mail</span>
            </button>
            <button aria-label="Help">
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        /* ── Root / layout ── */
        .mb-root {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0f0f0f;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        /* ── Background ── */
        .mb-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at center, #1a1010 0%, #0f0f0f 100%);
          overflow: hidden;
        }
        .mb-bg svg {
          position: absolute; width: 100%; height: 100%;
        }
        .mb-fog {
          position: absolute; width: 200%; height: 100%; top: 0; left: -50%;
          background: radial-gradient(circle at 50% 50%, rgba(255,77,26,0.04), transparent 70%);
          filter: blur(80px);
          animation: mb-driftFog 40s linear infinite;
        }
        @keyframes mb-driftFog {
          0%,100% { transform: translate(-10%,-5%) scale(1); }
          50%      { transform: translate(10%,5%) scale(1.1); }
        }

        /* ── Panel ── */
        .mb-panel {
          position: relative; z-index: 10;
          width: 95vw;
          max-width: 2200px;
          height: 92vh;
          border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(2px);
          box-shadow:
            0 30px 60px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.04),
            inset 0 1px 0 rgba(255,255,255,0.09);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── Content ── */
        .mb-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
          position: relative;
          z-index: 10;
          overflow: hidden;
          gap: 40px;
        }

        /* ── Hero ── */
        .mb-hero {
          text-align: center;
        }
        .mb-hero-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .mb-hero-sub {
          color: rgba(255,255,255,0.45);
          font-size: 17px;
          font-weight: 300;
          max-width: 480px;
          line-height: 1.6;
          margin: 0 auto 32px;
        }
        .mb-watch-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #ff4d1a, #c44536);
          border: none;
          border-radius: 999px;
          padding: 16px 48px;
          color: #fff;
          font-family: 'Bebas Neue', 'Inter', sans-serif;
          font-size: 26px;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mb-watch-btn::before {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          animation: mb-shine 3.5s infinite;
        }
        .mb-watch-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 0 32px rgba(255,77,26,0.55);
        }
        @keyframes mb-shine {
          0% { left: -100%; }
          20%, 100% { left: 200%; }
        }

        /* ── Marquee ── */
        .mb-marquee-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
        }
        .mb-marquee-track {
          width: 100%;
          overflow: hidden;
        }
        .mb-marquee-inner {
          display: flex;
          gap: 12px;
          width: max-content;
          will-change: transform;
        }
        .mb-marquee-inner.go-left  { animation: mb-goLeft  40s linear infinite; }
        .mb-marquee-inner.go-right { animation: mb-goRight 40s linear infinite; }
        @keyframes mb-goLeft  { 0% { transform: translateX(0); }    100% { transform: translateX(-25%); } }
        @keyframes mb-goRight { 0% { transform: translateX(-25%); } 100% { transform: translateX(0); } }

        /* ── Channel card ── */
        .mb-ch {
          flex-shrink: 0;
          width: 130px; height: 90px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          pointer-events: none;
          user-select: none;
        }
        .mb-ch img {
          width: 80%; height: 80%;
          object-fit: contain;
          display: block;
        }

        /* ── Footer ── */
        .mb-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 40px;
          flex-shrink: 0;
          position: relative;
          z-index: 20;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.2);
          color: rgba(255,255,255,0.4);
          font-size: 13px;
        }
        .mb-footer-links {
          display: flex;
          gap: 32px;
        }
        .mb-footer-links a {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .mb-footer-links a:hover { color: #ff4d1a; }
        .mb-footer-socials {
          display: flex;
          gap: 12px;
        }
        .mb-footer-socials button {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mb-footer-socials button:hover {
          background: #ff4d1a;
          border-color: #ff4d1a;
          color: #fff;
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(255,77,26,0.4);
        }
        .mb-footer-socials .material-symbols-outlined { font-size: 16px; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .mb-panel { border-radius: 20px; height: 96vh; }
          .mb-content { padding: 0 20px; gap: 28px; }
          .mb-hero-sub { font-size: 15px; }
          .mb-watch-btn { font-size: 20px; padding: 13px 36px; }
          .mb-ch { width: 100px; height: 70px; }
          .mb-footer { flex-direction: column; gap: 12px; text-align: center; padding: 16px 20px; }
          .mb-footer-links { gap: 16px; }
        }
      `}</style>
    </div>
    <Footer  />
    </>
  );
};

export default Home;