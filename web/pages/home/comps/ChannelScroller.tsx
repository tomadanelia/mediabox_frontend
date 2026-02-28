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
    if (s.startsWith("<") || s.length > 2048) {
      console.warn("[extractStreamUrl] looks like HTML, ignoring:", s.slice(0, 120))
      return null
    }
    return s
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>
    for (const key of ["url", "streamUrl", "stream_url", "hlsUrl", "hls_url", "src", "source", "link", "stream"]) {
      if (typeof obj[key] === "string") return extractStreamUrl(obj[key])
    }
    if (obj["data"] && typeof obj["data"] === "object") return extractStreamUrl(obj["data"])
  }
  console.warn("[extractStreamUrl] no URL found in:", data)
  return null
}

// ─── HLS thumbnail grabber ────────────────────────────────────────────────────
//
// Flow:
//   1. api.get()  →  our API server  (needs cookies)          ← done in component
//   2. HLS.js     →  media server    (different domain, no cookies, no CORS)
//
// CRITICAL: do NOT set video.crossOrigin at all.
//   crossOrigin="anonymous" forces a CORS preflight on the media server.
//   If that server doesn't return Access-Control-Allow-Origin the browser
//   silently blocks every .m3u8 / .ts request and HLS never fires any events.
//
// Trade-off: without crossOrigin the canvas will be "tainted" on cross-origin
//   streams, so toDataURL() throws. We catch that and return null gracefully.

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 360
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.82)
}

async function grabThumbnail(streamUrl: string): Promise<string | null> {
  if (!Hls.isSupported()) return null

  console.log("[grabThumbnail] starting:", streamUrl)

  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    // ⚠️  No crossOrigin property — intentional, see note above
    Object.assign(video.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      width: "320px",   // real size so the decode pipeline activates
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
      capLevelToPlayerSize: false,
      autoStartLoad: true,
      fragLoadingMaxRetry: 1,
      manifestLoadingMaxRetry: 1,
      levelLoadingMaxRetry: 1,
    })

    let settled = false

    const finish = (result: string | null) => {
      if (settled) return
      settled = true
      hls.stopLoad()
      hls.detachMedia()
      hls.destroy()
      video.remove()
      resolve(result)
    }

    const timeout = setTimeout(() => {
      console.warn("[grabThumbnail] timed out:", streamUrl)
      finish(null)
    }, 20_000)

    hls.on(Hls.Events.MANIFEST_PARSED, (_, d) =>
      console.log("[grabThumbnail] manifest OK, levels:", d.levels.length))

    hls.on(Hls.Events.FRAG_LOADING, (_, d) =>
      console.log("[grabThumbnail] frag loading:", d.frag.url))

    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      if (settled) return
      clearTimeout(timeout)
      video.currentTime = 0

      const doCapture = () => {
        try {
          finish(captureFrame(video))
        } catch (err) {
          // Canvas tainted — cross-origin stream without CORS headers on media server.
          // HLS loaded fine, we just can't export pixels. Return null, show gradient.
          console.warn("[grabThumbnail] canvas tainted (media server has no CORS headers):", err)
          finish(null)
        }
      }

      if (video.readyState >= 2) {
        doCapture()
      } else {
        video.addEventListener("loadeddata", doCapture, { once: true })
        video.play().then(() => video.pause()).catch(() => {})
      }
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      console.error("[grabThumbnail] HLS error:", data.type, data.details, "fatal:", data.fatal)
      if (data.fatal) {
        clearTimeout(timeout)
        finish(null)
      }
    })

    hls.loadSource(streamUrl)
    hls.attachMedia(video)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

type ThumbMap = Record<string, string | null | undefined>
//   undefined → not started  |  null → loading  |  string → ready

const ChannelScroller: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  const [thumbs, setThumbs] = useState<ThumbMap>({})
  const started = useRef<Set<string>>(new Set())

  useEffect(() => {
    const preview = channels.slice(0, 5)
    if (preview.length === 0) return

    preview.forEach(async (channel) => {
      if (started.current.has(channel.id)) return
      started.current.add(channel.id)

      setThumbs((prev) => ({ ...prev, [channel.id]: null }))

      try {
        // Step 1: fetch stream URL via our API (sends cookies via axios)
        const res = await api.get(`/channels/${channel.id}/stream`)
        console.log(`[ChannelScroller] stream response for ${channel.name}:`, res.data)

        const streamUrl = extractStreamUrl(res.data)
        if (!streamUrl) return

        // Step 2: HLS.js loads the actual stream directly from the media server
        // (no cookies needed, no CORS headers expected)
        const thumb = await grabThumbnail(streamUrl)
        if (thumb) setThumbs((prev) => ({ ...prev, [channel.id]: thumb }))
      } catch (e) {
        console.error(`[ChannelScroller] failed for ${channel.id}:`, e)
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

          return (
            <Link
              key={channel.id}
              to={`/stream?channel=${channel.id}`}
              className="group relative w-64 shrink-0 overflow-hidden rounded-xl border border-border shadow-lg transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"
            >
              {/* Gradient base – always visible */}
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `linear-gradient(135deg, ${color}, rgba(15,23,42,0.9))` }}
              />

              {/* Captured frame */}
              {typeof thumb === "string" && (
                <img
                  src={thumb}
                  alt={`${channel.name} preview`}
                  className="absolute inset-0 h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105"
                />
              )}

              {/* Spinner */}
              {thumb === null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              )}

              {/* Text */}
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