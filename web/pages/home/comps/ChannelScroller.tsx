import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Hls from "hls.js"
import api from "../../../src/lib/axios"

export type Channel = {
  id: string
  name: string
  genre: string
  viewers?: string
  color?: string
  thumbnail?: string
}

const PALETTE = [
  "rgba(59,130,246,0.85)",
  "rgba(16,185,129,0.85)",
  "rgba(236,72,153,0.85)",
  "rgba(234,179,8,0.85)",
  "rgba(14,165,233,0.85)",
  "rgba(168,85,247,0.85)",
  "rgba(239,68,68,0.85)",
]

// ─── URL extraction ───────────────────────────────────────────────────────────

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

// ─── HLS thumbnail grabber ────────────────────────────────────────────────────
// No crossOrigin on the video element — setting it causes a CORS preflight on
// the media server which likely has no CORS headers → browser blocks all chunks.

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
    video.autoplay = true  // ← add this so the browser actually decodes frames
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

    // ← Key change: capture on timeupdate, which only fires when real frames are decoded
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
    // video.play() will be triggered automatically via autoplay
    // but call it explicitly too for safety:
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {})
    })
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

// ThumbState:
//   undefined  → not started yet (renders nothing / gradient)
//   "loading"  → spinner
//   "failed"   → gradient only (no spinner)
//   string     → data-URL (renders <img>)
type ThumbState = undefined | "loading" | "failed" | string
type ThumbMap = Record<string, ThumbState>

const ChannelScroller: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  const [thumbs, setThumbs] = useState<ThumbMap>({})
  const started = useRef<Set<string>>(new Set())

  const setThumb = (id: string, state: ThumbState) =>
    setThumbs((prev) => ({ ...prev, [id]: state }))

  useEffect(() => {
    const preview = channels.slice(0, 5)
    if (preview.length === 0) return

    preview.forEach(async (channel) => {
      if (started.current.has(channel.id)) return
      started.current.add(channel.id)
      setThumb(channel.id, "loading")

      try {
        const res = await api.get(`/api/channels/${channel.id}/stream`)
        console.log(`[ChannelScroller] raw response for "${channel.name}":`, res.data)

        const streamUrl = extractStreamUrl(res.data)
        if (!streamUrl) {
          console.warn(
            `[ChannelScroller] could not extract URL from response for "${channel.name}". ` +
            `Response was:`, res.data
          )
          setThumb(channel.id, "failed")
          return
        }

        console.log(`[ChannelScroller] stream URL for "${channel.name}":`, streamUrl)

        // Step 2 — HLS.js fetches directly from media server (no cookies needed)
        const result = await grabThumbnail(streamUrl)

        if (result.ok) {
          setThumb(channel.id, result.dataUrl)
        } else {
          console.warn(`[ChannelScroller] thumbnail failed for "${channel.name}": reason=${result.reason}`)
          setThumb(channel.id, "failed")
        }
      } catch (e) {
        console.error(`[ChannelScroller] error for "${channel.name}":`, e)
        setThumb(channel.id, "failed")
      }
    })
  }, [channels])

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quick tune</p>
        <h3 className="text-xl font-semibold text-foreground">Switch channels</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {channels.slice(0, 5).map((channel, i) => {
          const color = channel.color ?? PALETTE[i % PALETTE.length]
          const thumb = thumbs[channel.id]
          const isLoading = thumb === "loading"
          const hasImage = typeof thumb === "string" && thumb !== "loading" && thumb !== "failed"

          return (
            <Link
              key={channel.id}
              to={`/stream?channel=${channel.id}`}
              className="group relative w-64 shrink-0 overflow-hidden rounded-xl border border-border shadow-lg transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
            >
              {/* Gradient base — always visible */}
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `linear-gradient(135deg, ${color}, rgba(15,23,42,0.9))` }}
              />

              {/* Captured frame */}
              {hasImage && (
                <img
                  src={thumb as string}
                  alt={`${channel.name} preview`}
                  className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105"
                />
              )}

              {/* Spinner while loading */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              )}

              {/* Text overlay */}
              <div className="relative flex h-32 flex-col justify-between p-4 text-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Live · {channel.genre}
                  </div>
                  <p className="text-lg font-semibold leading-tight drop-shadow">{channel.name}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-white/80">
                  {channel.viewers && <span>{channel.viewers} watching</span>}
                  <span className="rounded-full bg-white/10 px-2 py-1 font-medium">უყურე</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default ChannelScroller