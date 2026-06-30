import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Lock } from "lucide-react"
import useUIStore from "@/store/ui-store"
import type { Channel } from "../../../src/types/channel"
import { probeRewindableHours, getPreviewUrl } from "../../../src/services/streamService" // adjust import path if needed

const PALETTE = [
  "rgba(59,130,246,0.85)",
  "rgba(16,185,129,0.85)",
  "rgba(236,72,153,0.85)",
  "rgba(234,179,8,0.85)",
  "rgba(14,165,233,0.85)",
  "rgba(168,85,247,0.85)",
  "rgba(239,68,68,0.85)",
]

const translations = {
  En: { subscriptionLabel: "subscription is required", locked: "locked" },
  Ge: { subscriptionLabel: "საჭიროა პაკეტის შეძენა", locked: "დაბლოკილია" },
}

// ─── Preview fetching — now delegates to streamService's archive cache ─────
// Instead of opening an HLS stream and grabbing a video frame manually,
// we warm the archive cache (probeRewindableHours) and ask streamService
// for a ready-made preview mp4 URL at a recent timestamp. Zero extra
// network calls beyond the probe itself, and it's reused if the archive
// cache is already warm from elsewhere (e.g. the player).

type ThumbState = undefined | "loading" | "failed" | "locked" | string

async function fetchPreviewUrl(channelId: string): Promise<ThumbState> {
  try {
    await probeRewindableHours(channelId) // warms archiveCache[channelId]
    const ts = Math.floor(Date.now() / 1000) - 30 // a bit in the past so it's already recorded
    const url = getPreviewUrl(channelId, ts)
    return url ?? "failed"
  } catch (err: unknown) {
    if (err && typeof err === "object" && "response" in err && (err as { response?: { status?: number } }).response?.status === 403) {
      return "locked"
    }
    return "failed"
  }
}

// ─── Channel card — redesigned ──────────────────────────────────────────────
export const ChannelCard: React.FC<{ channel: Channel; index: number }> = ({ channel, index }) => {
  const color = PALETTE[index % PALETTE.length]
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [thumb, setThumb] = useState<ThumbState>(undefined)
  const started = useRef(false)
  const { isDark, language } = useUIStore()
  const tx = translations[language]
  const { setSelectedChannelId } = useUIStore()

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true; observer.disconnect()
          setThumb("loading"); fetchPreviewUrl(channel.id).then(setThumb)
        }
      },
      { rootMargin: "0px 100px 0px 0px", threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [channel.id])

  const isLoading = thumb === "loading"
  const isLocked = thumb === "locked"
  const hasImage = typeof thumb === "string" && !["loading","failed","locked"].includes(thumb)

  return (
    <>
      <Link
        ref={cardRef}
        onClick={() => { if (!isLocked) setSelectedChannelId(channel.id) }}
        to={isLocked ? "/packets" : `/tv/${channel.id}`}
        className={`pm-channel-card group relative w-80 shrink-0 overflow-hidden rounded-2xl shadow-lg ease-in-out transition-all duration-500 ${isLocked ? "pm-card-locked cursor-pointer" : "pm-card-live"}`}
      >
        {/* Gradient base */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(135deg, ${color}, rgba(10,10,20,0.97))`,
            filter: isLocked ? "saturate(0.2) brightness(0.45)" : undefined,
          }}
        />

        {/* Top gloss highlight */}
        <div className="pm-card-gloss" aria-hidden="true" />
        {/* Top shimmer edge */}
        <div className="pm-card-edge" aria-hidden="true" />

        {/* Live preview (looping mp4 from archive cache) */}
        {hasImage && (
          <video
            src={thumb as string}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-110 group-hover:opacity-90"
          />
        )}

        {/* Vignette */}
        <div className="pm-card-vignette" aria-hidden="true" />

        {/* Frosted overlay for locked */}
        {isLocked && <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />}

        {/* Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        )}

        {/* Lock badge */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pb-4">
            <div className="pm-lock-badge">
              <Lock className="h-4 w-4 text-white/55" />
            </div>
            <span className="pm-lock-text">{tx.subscriptionLabel}</span>
          </div>
        )}

        {/* Text content */}
        <div className={`relative flex h-36 flex-col justify-between p-5 text-white ${isLocked ? "opacity-25" : ""}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className={`pm-live-dot ${isLocked ? "pm-dot-locked" : "pm-dot-live"}`} />
              {isLocked ? tx.locked : "Live"}
            </div>
            <p className="pm-card-name">{channel.name}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-white/80">
            {!isLocked && (
              <span className="pm-watch-btn">უყურე</span>
            )}
          </div>
        </div>
      </Link>

      <style>{`
        .pm-channel-card {
          border: 1px solid rgba(255,255,255,0.07);
        }
        .pm-card-live:hover {
          transform: scale(1.12) translateX(8px);
          border-color: rgba(239,68,68,0.5);
          box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.35);
          z-index: 10;
          margin-left: 8px;
          margin-right: 8px;
        }
        .pm-card-locked {
          border-color: rgba(255,255,255,0.05);
        }
        .pm-card-gloss {
          position: absolute; top: 0; left: 0; right: 0; height: 45%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.08), transparent);
          pointer-events: none; z-index: 3;
        }
        .pm-card-edge {
          position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          z-index: 4;
        }
        .pm-card-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.7) 100%);
          z-index: 2; pointer-events: none;
        }
        .pm-live-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
        }
        .pm-dot-live {
          background: #4ade80;
          animation: live-pulse 2s ease-in-out infinite;
        }
        .pm-dot-locked { background: rgba(255,255,255,0.2); }
        @keyframes live-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.55; transform:scale(0.8); }
        }
        .pm-card-name {
          font-family: "Georgia", serif;
          font-size: 1.05rem; font-weight: normal;
          line-height: 1.3;
          color: rgba(255,255,255,0.95);
          letter-spacing: -0.01em;
        }
        .pm-watch-btn {
          font-family: "SF Mono", monospace;
          font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 0.28rem 0.8rem; border-radius: 999px;
          border: 1px solid rgba(239,68,68,0.38);
          color: rgba(255,190,190,0.85);
          background: rgba(239,68,68,0.1);
          transition: all 0.2s;
        }
        .pm-card-live:hover .pm-watch-btn {
          border-color: rgba(239,68,68,0.75);
          background: rgba(239,68,68,0.22);
          color: #fff;
        }
        .pm-lock-badge {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .pm-lock-text {
          font-family: "SF Mono", monospace;
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          text-align: center; max-width: 100px;
        }
      `}</style>
    </>
  )
}

// ─── ChannelScroller — unchanged ─────────────────────────────────────────────
const ChannelScroller: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick tune</p>
        <h3 className="text-xl font-semibold text-foreground">Switch channels</h3>
      </div>
      <div style={{ overflowX: "auto", overflowY: "visible" }} className="scrollbar-hide">
        <div className="flex gap-4 pt-8 pl-3 pb-4 -mt-4" style={{ overflow: "visible" }}>
          {channels.map((channel, i) => (
            <ChannelCard key={channel.id} channel={channel} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ChannelScroller