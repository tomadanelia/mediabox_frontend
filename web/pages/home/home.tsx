import React, { useEffect, useState } from "react"
import { API_BASE_URL } from "../../src/config"
import ChannelScroller from "./comps/ChannelScroller"
import type { Channel } from "./comps/ChannelScroller"
import useUIStore from "@/store/ui-store"

const API_BASE = `${API_BASE_URL}/api`

// ─── Translations ─────────────────────────────────────────────────────────────
const HERO_TEXT = {
  En: {
    eyebrow:       "Your universe of live content",
    wordmarkMedia: "media",
    wordmarkBox:   "box",
    tagline:       "Stream thousands of live channels, on-demand series, and curated collections — all in one place.",
    pills:         ["Live TV", "Movies", "Series", "Sports", "News", "Kids"],
  },
  Ge: {
    eyebrow:       "შენი პირდაპირი კონტენტის სამყარო",
    wordmarkMedia: "მედია",
    wordmarkBox:   "ბოქსი",
    tagline:       "ათასობით პირდაპირი არხი, სერიალი და კურირებული კოლექცია — ყველაფერი ერთ ადგილას.",
    pills:         ["პირდაპირი", "ფილმები", "სერიალები", "სპორტი", "სიახლეები", "საბავშვო"],
  },
} as const

type Lang = keyof typeof HERO_TEXT

// ─── Hero Banner ──────────────────────────────────────────────────────────────
interface HeroBannerProps {
  heroImage?: string | null
  language: string
}

const HeroBanner: React.FC<HeroBannerProps> = ({ heroImage, language }) => {
  const lang: Lang = language === "Ge" ? "Ge" : "En"
  const t = HERO_TEXT[lang]

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

        <h1 className="hero-wordmark">
          <span className="hero-wordmark-media">{t.wordmarkMedia}</span>
          <span className="hero-wordmark-box">{t.wordmarkBox}</span>
        </h1>

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
          --hero-accent: #e8a030;
          --hero-accent2: #c0392b;
          --hero-h: 340px;
          position: relative;
          width: 100%;
          height: var(--hero-h);
          border-radius: 1.25rem;
          overflow: hidden;
          background-color: #07080f;
          background-image:
            radial-gradient(ellipse 120% 80% at 70% 40%, #1a1060 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 20% 80%, #200a10 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 85% 85%, #0a1a2a 0%, transparent 50%);
          background-size: cover;
          background-position: center;
          box-shadow:
            0 4px 6px -1px rgb(0 0 0 / 0.5),
            0 20px 60px -10px rgb(0 0 0 / 0.6);
        }
        .hero-grain {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.04; pointer-events: none; mix-blend-mode: overlay;
        }
        .hero-wash {
          position: absolute; inset: 0;
          background: conic-gradient(from 200deg at 75% 45%, transparent 0deg, #1a0a3a18 60deg, transparent 120deg);
          pointer-events: none;
        }
        .hero-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(7,8,15,0.55) 75%, rgba(7,8,15,0.92) 100%);
          pointer-events: none;
        }
        .hero-banner::before {
          content: "";
          position: absolute; top: 0; left: 5%; right: 5%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--hero-accent) 30%, var(--hero-accent2) 70%, transparent);
          opacity: 0.6;
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
        .hero-wordmark {
          font-family: "Georgia", "Palatino Linotype", serif;
          font-size: clamp(2.4rem, 5vw, 3.8rem);
          font-weight: 700; letter-spacing: -0.03em; line-height: 1; margin: 0;
          animation: hero-fadein 0.7s ease both; animation-delay: 0.08s;
        }
        .hero-wordmark-media { color: #f0ede6; }
        .hero-wordmark-box  { color: var(--hero-accent); font-style: italic; }
        .hero-tagline {
          font-family: "Georgia", serif;
          font-size: clamp(0.78rem, 1.4vw, 0.92rem);
          color: rgba(210, 205, 195, 0.8); max-width: 480px;
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
          padding: 0.25rem 0.7rem; border-radius: 999px;
          border: 1px solid rgba(232, 160, 48, 0.28);
          color: rgba(232, 160, 48, 0.75); background: rgba(232, 160, 48, 0.06);
          backdrop-filter: blur(4px);
          transition: border-color 0.2s, color 0.2s;
          cursor: default; user-select: none;
        }
        .hero-pill:hover { border-color: rgba(232, 160, 48, 0.6); color: rgba(232, 160, 48, 1); }
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
  const { isDark, language } = useUIStore()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/channels`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setChannels(data.channels)
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