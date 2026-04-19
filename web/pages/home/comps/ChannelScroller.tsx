import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Hls from "hls.js"
import { Lock } from "lucide-react"
import api from "../../../src/lib/axios"
import useUIStore from "@/store/ui-store"
import type {Channel} from "../../../src/types/channel"

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
  En: {
    subscriptionLabel: 'subscription is required',
    locked:"locked"
  },
  Ge:{
    subscriptionLabel: 'საჭიროა პაკეტის შეძენა',
    locked:"დაბლოკილია"
  }
}
function extractStreamUrl(data: unknown): string | null {
  if (!data) return null
  if (typeof data === "string") {
    const s = data.trim()
    if (s.startsWith("<") || s.length > 2048) return null
    return s
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>
    for (const key of ["url", "streamUrl", "stream_url", "hlsUrl", "hls_url", "src", "source", "link", "stream"]) {
      if (typeof obj[key] === "string") return extractStreamUrl(obj[key])
    }
    if (obj["data"] && typeof obj["data"] === "object") return extractStreamUrl(obj["data"])
  }
  return null
}

// ─── Canvas capture ───────────────────────────────────────────────────────────

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 360
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.82)
}

type GrabResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "no-hls" | "timeout" | "hls-error" | "tainted" | "no-video-data" }

async function grabThumbnail(streamUrl: string): Promise<GrabResult> {
  if (!Hls.isSupported()) return { ok: false, reason: "no-hls" }

  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    Object.assign(video.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      width: "320px",
      height: "180px",
      opacity: "0",
      pointerEvents: "none",
    })
    document.body.appendChild(video)

    const hls = new Hls({
      maxBufferLength: 4,
      maxMaxBufferLength: 4,
      maxBufferSize: 0,
      startLevel: 0,
      autoStartLoad: true,
      fragLoadingMaxRetry: 1,
      manifestLoadingMaxRetry: 1,
      levelLoadingMaxRetry: 1,
    })

    let settled = false
    const finish = (r: GrabResult) => {
      if (settled) return
      settled = true
      hls.stopLoad()
      hls.detachMedia()
      hls.destroy()
      video.remove()
      resolve(r)
    }

    const timeout = setTimeout(() => finish({ ok: false, reason: "timeout" }), 20_000)

    const onTimeUpdate = () => {
      if (video.videoWidth === 0 || video.readyState < 2) return
      clearTimeout(timeout)
      video.pause()
      try {
        finish({ ok: true, dataUrl: captureFrame(video) })
      } catch {
        finish({ ok: false, reason: "tainted" })
      }
    }
    video.addEventListener("timeupdate", onTimeUpdate)

    hls.on(Hls.Events.ERROR, (_, d) => {
      if (d.fatal) {
        clearTimeout(timeout)
        finish({ ok: false, reason: "hls-error" })
      }
    })

    hls.loadSource(streamUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {})
    })
  })
}


type ThumbState = undefined | "loading" | "failed" | "locked" | string

async function fetchThumb(channelId: string): Promise<ThumbState> {
  try {
    const res = await api.get(`/api/channels/${channelId}/stream`)
    const streamUrl = extractStreamUrl(res.data)
    if (!streamUrl) return "failed"

    const result = await grabThumbnail(streamUrl)
    return result.ok ? result.dataUrl : "failed"
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 403
    ) {
      return "locked"
    }
    return "failed"
  }
}

// ─── Single channel card ──────────────────────────────────────────────────────

export const ChannelCard: React.FC<{ channel: Channel; index: number }> = ({ channel, index }) => {
  const color =  PALETTE[index % PALETTE.length]
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [thumb, setThumb] = useState<ThumbState>(undefined)
  const started = useRef(false)
  const { isDark, language } = useUIStore();
  const tx= translations[language];
  const { setSelectedChannelId } = useUIStore();

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          observer.disconnect()
          setThumb("loading")
          fetchThumb(channel.id).then(setThumb)
        }
      },
      { rootMargin: "0px 100px 0px 0px", threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [channel.id])

  const isLoading = thumb === "loading"
  const isLocked = thumb === "locked"
  const hasImage = typeof thumb === "string" && !["loading", "failed", "locked"].includes(thumb)

  return (
    <Link
      ref={cardRef}
      onClick={() => {
        if (!isLocked) setSelectedChannelId(channel.id);
      }}
      to={isLocked ? "/packets" : `/TV/${channel.id}`}
      className={`group relative w-80 shrink-0 overflow-hidden rounded-xl border shadow-lg  ease-in-out transition-all duration-500
  ${isLocked
    ? "border-white/10 cursor-pointer"
    : "border-border hover:scale-[1.18] hover:ml-5 hover:mx-3  hover:border-primary/60 hover:shadow-2xl hover:shadow-black/40 hover:z-10"
  }`}
    >
      {/* Gradient base — desaturated when locked */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(135deg, ${color}, rgba(15,23,42,0.9))`,
          filter: isLocked ? "saturate(0.25) brightness(0.45)" : undefined,
        }}
      />

      {/* Captured frame */}
      {hasImage && (
        <img
          src={thumb as string}
          alt={`${channel.name} preview`}
          className="absolute inset-0 h-full w-full object-cover opacity-85 transition-all duration-500 group-hover:scale-110 group-hover:opacity-95"
        />
      )}

      {/* Frosted dark overlay for locked */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" />
      )}

      {/* Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      )}

      {/* Lock badge — centred, shown above the text */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pb-6">
          <div className="flex h-9 w-9 mt-8 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Lock className="h-4 w-4 text-white/60" />
          </div>
          <span className="text-[11px] font-medium tracking-wide text-white/45">
            {tx.subscriptionLabel}
          </span>
        </div>
      )}

      {/* Text overlay — taller to match bigger card */}
      <div className={`relative flex h-36 flex-col justify-between p-5 text-white ${isLocked ? "opacity-35" : ""}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className={`h-2 w-2 rounded-full ${isLocked ? "bg-white/25" : "bg-green-400"}`} />
            {isLocked ? tx.locked : "Live"}
          </div>
          <p className="text-lg font-semibold leading-tight drop-shadow">{channel.name}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-white/80">
          {!isLocked && (
            <span className="rounded-full bg-white/10 px-2 py-1 font-medium">უყურე</span>
          )}
        </div>
      </div>
    </Link>
  )
}


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