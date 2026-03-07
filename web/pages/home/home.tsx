import React, { useEffect, useState } from "react"
import { API_BASE_URL } from "../../src/config"
import ChannelScroller from "./comps/ChannelScroller"
import type { Channel } from "./comps/ChannelScroller"
import useUIStore from "@/store/ui-store"
import api from "@/lib/axios"
const API_BASE = `${API_BASE_URL}/api`

// ─── Translations ─────────────────────────────────────────────────────────────
const HERO_TEXT = {
  En: {
    eyebrow:       "Your universe of live content",
    tagline:       "Stream thousands of live channels, on-demand series, and curated collections — all in one place.",
    pills:         ["Live TV", "Movies", "Series", "Sports", "News", "Kids"],
  },
  Ge: {
    eyebrow:       "შენი პირდაპირი კონტენტის სამყარო",
    tagline:       "ათასობით პირდაპირი არხი, სერიალი და კურირებული კოლექცია — ყველაფერი ერთ ადგილას.",
    pills:         ["პირდაპირი", "ფილმები", "სერიალები", "სპორტი", "სიახლეები", "საბავშვო"],
  },
} as const

type Lang = keyof typeof HERO_TEXT

interface HeroBannerProps {
  heroImage?: string | null
  language: string
}

const HeroBanner: React.FC<HeroBannerProps> = ({ heroImage, language }) => {
  const lang: Lang = language === "Ge" ? "Ge" : "En"
  const t = HERO_TEXT[lang]
  const { isDark } = useUIStore()
  const currentLogo = useUIStore((state) => state.logoLight)
  console.log("HeroBanner logo:", currentLogo) // ← does it show the full URL or local path?
  
  return (
    <section
      className="hero-banner"
      style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
    >
      <div className="hero-grain" aria-hidden="true" />
      {!heroImage && <div className="hero-wash" aria-hidden="true" />}
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-eyebrow">{t.eyebrow}</p>

        <img src={currentLogo} onError={(e) => {
    e.currentTarget.style.visibility = "hidden"
    e.currentTarget.onerror = null
  }}
  onLoad={(e) => {
    e.currentTarget.style.visibility = "visible"
  }} alt="mediabox" className="hero-logo" />

        <p className="hero-tagline">{t.tagline}</p>

        <div className="hero-pills" aria-hidden="true">
          {t.pills.map((label) => (
            <span key={label} className="hero-pill">
              {label}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .hero-banner {
          --hero-accent: #ef4444;
          --hero-accent2: #b91c1c;
          --hero-h: 340px;
          position: relative;
          width: 100%;
          height: var(--hero-h);
          border-radius: 1.25rem;
          overflow: hidden;
          background-color: #0c0203;
          background-image:
            radial-gradient(ellipse 130% 90% at 65% 30%, #3b0a0a 0%, transparent 55%),
            radial-gradient(ellipse 90% 70% at 15% 85%, #1a0505 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 90% 80%, #200a0a 0%, transparent 50%);
          background-size: cover;
          background-position: center;
          box-shadow:
            0 4px 6px -1px rgb(0 0 0 / 0.6),
            0 20px 60px -10px rgba(185, 28, 28, 0.25);
        }
        .hero-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.05; pointer-events: none; mix-blend-mode: overlay;
        }
        .hero-wash {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 50% at 80% 20%, rgba(239,68,68,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 35%, rgba(12,2,3,0.6) 70%, rgba(12,2,3,0.95) 100%);
          pointer-events: none;
        }
        .hero-banner::before {
          content: "";
          position: absolute; top: 0; left: 5%; right: 5%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--hero-accent) 40%, var(--hero-accent2) 60%, transparent);
          opacity: 0.7;
        }
        .hero-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          justify-content: flex-end;
          padding: 2rem 2.25rem 2rem;
          gap: 0.55rem;
        }
        .hero-eyebrow {
          font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
          font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--hero-accent); opacity: 0.9; margin: 0;
          animation: hero-fadein 0.6s ease both;
        }
        .hero-logo {
          height: clamp(2.8rem, 6vw, 4.4rem);
          width: auto;
          object-fit: contain;
          object-position: left center;
          filter: drop-shadow(0 2px 24px rgba(239,68,68,0.3)) brightness(1.05);
          animation: hero-fadein 0.7s ease both;
          animation-delay: 0.08s;
        }
        .hero-tagline {
          font-family: "Georgia", serif;
          font-size: clamp(0.78rem, 1.4vw, 0.92rem);
          color: rgba(255, 220, 220, 0.7); max-width: 480px;
          line-height: 1.55; margin: 0;
          animation: hero-fadein 0.7s ease both; animation-delay: 0.16s;
        }
        .hero-pills {
          display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.25rem;
          animation: hero-fadein 0.7s ease both; animation-delay: 0.28s;
        }
        .hero-pill {
          font-family: "SF Mono", monospace;
          font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.28rem 0.75rem; border-radius: 999px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: rgba(255, 200, 200, 0.8);
          background: rgba(239, 68, 68, 0.08);
          backdrop-filter: blur(6px);
          transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s;
          cursor: pointer;
          user-select: none;
        }
        .hero-pill:hover {
          border-color: rgba(239, 68, 68, 0.7);
          color: #ffffff;
          background: rgba(239, 68, 68, 0.18);
          transform: translateY(-1px);
        }
        .hero-pill:active { transform: translateY(0); }
        @keyframes hero-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .hero-banner { --hero-h: 260px; border-radius: 0.75rem; }
          .hero-content { padding: 1.25rem; }
          .hero-tagline { display: none; }
        }
      `}</style>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const {  language } = useUIStore()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get("/api/channels")
        setChannels(Array.isArray(res.data.channels) ? res.data.channels : [])
      } catch (e) {
        console.error("[Home/fetchChannels]", e)
      }
    })()
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <HeroBanner heroImage={null} language={language} />
      <ChannelScroller channels={channels} />
    </main>
  )
}

export default Home