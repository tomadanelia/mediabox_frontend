'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Hls from 'hls.js';
import { CometRing } from './AnimatedComponents/CometBuffer';
import FullScreenList from './FullScreenList';
import { SettingsButton } from './settingsButton';
import { PlayerSettingsService } from '@/services/playerSettingsService';

type Channel = {
  id: string; uuid: string; name: string; logo: string;
  number: number; category: string; category_id: string;
}
type ProgramItem = {
  UID: number; CHANNEL_ID: number; START_TIME: number; END_TIME: number;
  TITLE: string; GANRE?: string; DESCRIPTION?: string;
}
type VideoPlayerProps = {
  streamUrl: string;
  mode: 'live' | 'archive';
  archiveTimestamp: number | null;
  isLoading?: boolean;
  onRewind: (timestamp: number) => void;
  onGoLive: () => void;
  onChannelSelect?: (channel: Channel) => void;
  currentChannelId?: string;
  rewindableDays?: number;
  channels?: Channel[];
  programs?: ProgramItem[];
  nextDayPrograms?: ProgramItem[];
};

function formatClock(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

const Icon = ({ name, size = 20, fill = false }: { name: string; size?: number; fill?: boolean }) => (
  <span
    className="material-symbols-outlined pointer-events-none select-none"
    style={{
      fontSize: size,
      display: 'block',
      lineHeight: 1,
      fontVariationSettings: fill
        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    }}
  >
    {name}
  </span>
);

// ─── Control button ───────────────────────────────────────────────────────────

const Btn = ({
  icon, onClick, title, size = 20, fill = false, disabled = false,
}: {
  icon: string; onClick?: () => void; title?: string;
  size?: number; fill?: boolean; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className="pointer-events-auto relative z-10 flex items-center justify-center w-9 h-9 rounded-lg text-white hover:text-[#d52b1e] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
  >
    <Icon name={icon} size={size} fill={fill} />
  </button>
);

// ─── Component ────────────────────────────────────────────────────────────────

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl, mode, archiveTimestamp, isLoading = false,
  onRewind, onGoLive, onChannelSelect, currentChannelId,
  rewindableDays, channels = [], programs = [], nextDayPrograms = [],
}) => {
  const videoRef        = useRef<HTMLVideoElement | null>(null);
  const containerRef    = useRef<HTMLDivElement | null>(null);
  const hlsRef          = useRef<Hls | null>(null);
  const settingsService = useRef(new PlayerSettingsService());
  const hideTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volHideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSeekingRef    = useRef(false);
  const isReloadingRef  = useRef(false);

  // ── User-intended audio state — never corrupted by autoplay fallback ──────
  const mutedIntentRef  = useRef(false);
  const volumeIntentRef = useRef(1);

  // ── Synchronous refs — updated every render, never stale ─────────────────
  const modeRef      = useRef(mode);
  const archiveTsRef = useRef(archiveTimestamp);
  const onRewindRef  = useRef(onRewind);
  const onGoLiveRef  = useRef(onGoLive);
  modeRef.current      = mode;
  archiveTsRef.current = archiveTimestamp;
  onRewindRef.current  = onRewind;
  onGoLiveRef.current  = onGoLive;

  const prevArchiveTsRef = useRef<number | null>(archiveTimestamp);
  const prevStreamUrlRef = useRef<string>(streamUrl);
  const seekPendingRef   = useRef<boolean>(false);
  const [currentTime,      setCurrentTime]      = useState(0);
  // Compute deltas before advancing the refs.
  const archiveTsChanged = archiveTimestamp !== prevArchiveTsRef.current;
  const streamUrlChanged = streamUrl        !== prevStreamUrlRef.current;

  if (archiveTsChanged) seekPendingRef.current = true;   // new seek requested
  if (streamUrlChanged) seekPendingRef.current = false;  // matching URL arrived

  const displayCurrentTime =
    (seekPendingRef.current || archiveTsChanged || streamUrlChanged) ? 0 : currentTime;

  // Advance refs only after the deltas have been used above.
  prevArchiveTsRef.current = archiveTimestamp;
  prevStreamUrlRef.current = streamUrl;

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolumeSlider(false);
    }, 3000);
  };

  const cancelHide = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setShowControls(prev => prev ? prev : true);
  };

  const [isPlaying,        setIsPlaying]        = useState(false);

  const [volume,           setVolume]           = useState(1);
  const [isMuted,          setIsMuted]          = useState(false);
  const [showControls,     setShowControls]     = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen,     setIsFullscreen]     = useState(false);
  const [showChannels,     setShowChannels]     = useState(false);
  const [isBuffering,      setIsBuffering]      = useState(false);

  const [liveNow, setLiveNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (volHideTimer.current) clearTimeout(volHideTimer.current);
    };
  }, []);

  // ── watchingUnix ──────────────────────────────────────────────────────────
  // archive: seek anchor + seconds the new stream has played since loading.
  // live:    current wall clock.
  const watchingUnix =
    mode === 'archive' && archiveTimestamp !== null
      ? archiveTimestamp + Math.floor(displayCurrentTime)
      : liveNow;

  // ── Seekbar range: current program only ───────────────────────────────────
  const { rangeStart, rangeEnd } = useMemo(() => {
    const cur = programs.find(p => watchingUnix >= p.START_TIME && watchingUnix < p.END_TIME);
    if (cur) return { rangeStart: cur.START_TIME, rangeEnd: cur.END_TIME };
    const d        = new Date(watchingUnix * 1000);
    const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
    return { rangeStart: midnight, rangeEnd: midnight + 86400 };
  }, [programs, watchingUnix]);

  const rangeDuration = Math.max(rangeEnd - rangeStart, 1);
  const progressPct   = Math.min(100, Math.max(0, ((watchingUnix - rangeStart) / rangeDuration) * 100));

  // ── HLS ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    isSeekingRef.current   = true;
    isReloadingRef.current = true;

    hlsRef.current?.destroy();
    settingsService.current.detach();
    setIsBuffering(true);
    setCurrentTime(0);

    // Read from intent refs — never from the DOM, which may be mid-autoplay-fallback
    const wasMuted  = mutedIntentRef.current;
    const wasVolume = volumeIntentRef.current;

    const tryPlay = () => {
      video.muted  = wasMuted;
      video.volume = wasVolume;
      isReloadingRef.current = false;
      // Sync React state to match the actual DOM state after reload
      setIsMuted(wasMuted);
      if (!wasMuted) setVolume(wasVolume);
      return video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true; setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        isSeekingRef.current = false;
        setIsBuffering(false);
        settingsService.current.attach(hls);
        tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          isSeekingRef.current = false;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.onloadedmetadata = () => {
        isSeekingRef.current = false;
        // Sync mute state for native HLS (Safari) too
        setIsMuted(video.muted);
        if (!video.muted) setVolume(video.volume);
      };
      setIsBuffering(false);
      tryPlay();
    }

    return () => { hlsRef.current?.destroy(); settingsService.current.detach(); };
  }, [streamUrl]);

  // ── Video events ──────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onPlay       = () => setIsPlaying(true);
    const onPause      = () => setIsPlaying(false);
    const onWaiting    = () => setIsBuffering(true);
    const onPlaying    = () => setIsBuffering(false);
    // Keep isMuted in sync with any external/browser-level mute changes
    const onVolumeChange = () => {
      if (isReloadingRef.current) return;
      setIsMuted(video.muted || video.volume === 0);
      if (video.volume > 0) setVolume(video.volume);
    };

    const onEnded = () => {
      if (isSeekingRef.current) return;
      if (modeRef.current === 'archive' && archiveTsRef.current !== null) {
        const resumeAt = archiveTsRef.current + Math.floor(video.currentTime);
        if (Math.floor(Date.now() / 1000) - resumeAt >= 10) {
          onRewindRef.current(resumeAt);
        }
      }
    };

    video.addEventListener('timeupdate',   onTimeUpdate);
    video.addEventListener('play',         onPlay);
    video.addEventListener('pause',        onPause);
    video.addEventListener('waiting',      onWaiting);
    video.addEventListener('playing',      onPlaying);
    video.addEventListener('ended',        onEnded);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate',   onTimeUpdate);
      video.removeEventListener('play',         onPlay);
      video.removeEventListener('pause',        onPause);
      video.removeEventListener('waiting',      onWaiting);
      video.removeEventListener('playing',      onPlaying);
      video.removeEventListener('ended',        onEnded);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) scheduleHide();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current;
    if (v) v.paused ? v.play() : v.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ts   = Math.floor(rangeStart + pct * rangeDuration);
    if (ts >= Math.floor(Date.now() / 1000)) return;
    onRewind(ts);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted  = vol === 0;
    }
    mutedIntentRef.current  = vol === 0;
    volumeIntentRef.current = vol > 0 ? vol : volumeIntentRef.current;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) {
      const restoreVol = volume > 0 ? volume : 0.5;
      v.muted  = false;
      v.volume = restoreVol;
      mutedIntentRef.current  = false;
      volumeIntentRef.current = restoreVol;
      setIsMuted(false);
      setVolume(restoreVol);
    } else {
      v.muted  = true;
      v.volume = 0;
      mutedIntentRef.current = true;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const now  = Math.floor(Date.now() / 1000);
    const base =
      modeRef.current === 'archive' && archiveTsRef.current !== null
        ? archiveTsRef.current + Math.floor(videoRef.current?.currentTime ?? 0)
        : now;
    const target = base + seconds;

    if (seconds < 0) {
      onRewindRef.current(Math.max(0, target));
    } else if (modeRef.current === 'archive') {
      if (target >= now) onGoLiveRef.current();
      else onRewindRef.current(target);
    }
  };

  const toggleFullscreen = () => {
    !document.fullscreenElement
      ? containerRef.current?.requestFullscreen()
      : document.exitFullscreen();
  };

  // ── Keyboard controls ─────────────────────────────────────────────────────

  const skipRef      = useRef(skip);
  const togglePlayRef = useRef(togglePlay);
  useEffect(() => { skipRef.current = skip; });
  useEffect(() => { togglePlayRef.current = togglePlay; });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); skipRef.current(-30); }
      if (e.key === 'ArrowRight') { e.preventDefault(); skipRef.current(30);  }
      if (e.key === ' ')          { e.preventDefault(); togglePlayRef.current(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // ── Double-tap seek ───────────────────────────────────────────────────────

  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCount = useRef<{ left: number; right: number }>({ left: 0, right: 0 });

  const handleTap = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect   = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const touchX = e.changedTouches[0].clientX;
    const side   = touchX - rect.left < rect.width / 2 ? 'left' : 'right';
    tapCount.current[side] += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (tapCount.current[side] >= 2) {
        side === 'left' ? skipRef.current(-10) : skipRef.current(10);
      }
      tapCount.current = { left: 0, right: 0 };
    }, 300);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden aspect-video w-full max-h-full ${isFullscreen ? '' : 'rounded-[10px]'}`}
        style={{ maxWidth: 'calc((100vh - 80px) * (16/9))' }}
        onMouseEnter={() => { cancelHide(); scheduleHide(); }}
        onMouseMove={() => { cancelHide(); scheduleHide(); }}
        onMouseLeave={scheduleHide}
        onTouchEnd={handleTap}
      >
        {/* Video */}
        <video ref={videoRef} className="absolute inset-0 w-full h-full" />

        {/* Spinner */}
        {(isLoading || isBuffering) && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
            <CometRing />
          </div>
        )}

        {/* Fullscreen channel list */}
        {isFullscreen && showChannels && (
          <FullScreenList
            onClose={() => setShowChannels(false)}
            onSelect={(ev) => {
              onChannelSelect?.(ev.channel);
              if (ev.mode === 'archive' && ev.timestamp !== undefined) onRewind(ev.timestamp);
            }}
            currentChannelId={currentChannelId}
            rewindableDays={rewindableDays}
          />
        )}

        {/* Controls */}
        <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

          {isFullscreen && (
            <button
              onClick={() => setShowChannels(v => !v)}
              className="pointer-events-auto absolute top-4 right-4 text-white hover:text-[#d52b1e] cursor-pointer flex items-center justify-center w-9 h-9 bg-black/60 backdrop-blur-sm rounded-lg border border-white/15"
            >
              <span className="material-symbols-outlined pointer-events-none select-none" style={{ fontSize: '20px', display: 'block', lineHeight: 1 }}>list</span>
            </button>
          )}

          {/* Center controls */}
          <div className="absolute left-0 right-0 flex items-center justify-center gap-6" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <Btn icon="replay"  onClick={() => skip(-30)} title="−30s" size={28} />
            <Btn icon={isPlaying ? 'pause' : 'play_arrow'} onClick={togglePlay} size={42} fill />
            <Btn icon="forward_media" onClick={() => skip(30)}  title="+30s" size={28} disabled={mode === 'live'} />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 pb-3 px-3 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent">

            {mode === 'archive' && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={onGoLive}
                  className="pointer-events-auto flex items-center gap-1.5 cursor-pointer text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#d52b1e' }}
                >
                  <Icon name="sensors" size={16} fill />
                  Go Live
                </button>
              </div>
            )}

            <div className="pointer-events-auto flex items-center gap-2">

              {/* Volume */}
              <div className="relative shrink-0"
                onMouseEnter={() => {
                  if (volHideTimer.current) { clearTimeout(volHideTimer.current); volHideTimer.current = null; }
                  setShowVolumeSlider(true);
                }}
                onMouseLeave={() => {
                  volHideTimer.current = setTimeout(() => setShowVolumeSlider(false), 400);
                }}>
                <Btn icon={isMuted ? 'volume_off' : 'volume_up'} onClick={toggleMute} size={20} fill={isMuted} />
                {showVolumeSlider && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pb-9">
                    <div className="h-32 w-10 flex items-start justify-center pt-1">
                      <div className="h-28 w-6 rounded bg-black/70 backdrop-blur-sm flex items-center justify-center relative">
                        <div className="absolute bottom-2 w-1.5 rounded-full left-1/2 -translate-x-1/2"
                          style={{ height: `${(isMuted ? 0 : volume) * 72}%`, background: '#d52b1e' }} />
                        <input type="range" min="0" max="1" step="0.01"
                          value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                          className="absolute w-24 appearance-none rounded-full cursor-pointer -rotate-90"
                          style={{ background: 'transparent' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clock */}
              <div className="flex items-center gap-1.5 text-white text-xs font-mono select-none shrink-0">
                {mode === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {formatClock(watchingUnix)}
              </div>

              {/* Seekbar */}
              <div className="flex-1 h-4 flex items-center cursor-pointer" onClick={handleSeek}>
                <div className="relative w-full h-1 bg-white/25 rounded-full">
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${progressPct}%`, backgroundColor: '#d52b1e' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow" style={{ left: `${progressPct}%`, backgroundColor: '#d52b1e' }} />
                </div>
              </div>

              {/* Right buttons */}
              <div className="flex items-center shrink-0">
                <Btn icon="cast" disabled title="Cast" size={20} />
                <SettingsButton service={settingsService.current} />
                <Btn icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} onClick={toggleFullscreen} size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;