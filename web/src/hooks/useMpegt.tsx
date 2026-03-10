import { useEffect, useRef, useCallback } from 'react'
import mpegts from 'mpegts.js'

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

interface Options {
  onStatus: (s: Status) => void
  volume: number
  muted: boolean
}

export function useMpegtsPlayer({ onStatus, volume, muted }: Options) {
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const playerRef = useRef<mpegts.Player | null>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume
    }
  }, [volume, muted])

  const destroy = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause()
      playerRef.current.unload()
      playerRef.current.detachMediaElement()
      playerRef.current.destroy()
      playerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.src = ''
    }
  }, [])

  const load = useCallback(async (url: string, type: string = 'mpegts') => {
    if (!audioRef.current) return

    destroy()
    onStatus('loading')

    if (!mpegts.isSupported()) {
      console.error('mpegts.js is not supported in this browser')
      onStatus('error')
      return
    }

    // Web Workers can't resolve relative URLs — must be absolute.
    // Route the CDN stream through the Vite proxy using window.location.origin
    // so the worker gets a full URL like http://localhost:5173/radio-stream/...
    const proxiedUrl = url.replace(
      /^https?:\/\/cdn\.streamer\.mediabox\.ge/,
      `${window.location.origin}/radio-stream`
    )

    const mediaType = (type === 'flv' ? 'flv' : 'mpegts') as 'mpegts' | 'flv'

    const player = mpegts.createPlayer(
      {
        type: mediaType,
        url: proxiedUrl,
        isLive: true,
      },
      {
        enableWorker: true,
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 3.0,
        liveBufferLatencyMinRemain: 0.5,
      }
    )

    player.attachMediaElement(audioRef.current)
    player.load()

    player.on(mpegts.Events.ERROR, () => {
      onStatus('error')
    })

    audioRef.current.oncanplay = () => {
      audioRef.current!.volume = muted ? 0 : volume
      audioRef.current!
        .play()
        .then(() => onStatus('playing'))
        .catch(() => onStatus('error'))
    }

    playerRef.current = player
  }, [destroy, onStatus, volume, muted])

  useEffect(() => () => destroy(), [destroy])

  return { audioRef, load, destroy }
}