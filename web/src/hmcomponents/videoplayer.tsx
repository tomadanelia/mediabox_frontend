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
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function getWatchingUnix(
  mode: 'live' | 'archive', liveNow: number,
  archiveTimestamp: number | null, currentTime: number,
): number {
  if (mode === 'archive' && archiveTimestamp !== null) {
    return archiveTimestamp + Math.floor(currentTime);
  }
  return liveNow;
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
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef       = useRef<Hls | null>(null);
  const settingsService = useRef(new PlayerSettingsService());
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      setShowVolumeSlider(false);
    }, 300);
  };

  const cancelHide = () => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
    setShowControls(true);
  };

  const [isPlaying,        setIsPlaying]        = useState(false);
  const [currentTime,      setCurrentTime]      = useState(0);
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

  const watchingUnix = getWatchingUnix(mode, liveNow, archiveTimestamp, currentTime);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (!programs.length) {
      const d = new Date(watchingUnix * 1000);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
      return { rangeStart: midnight, rangeEnd: midnight + 86400 };
    }
    const sorted     = [...programs].sort((a, b) => a.START_TIME - b.START_TIME);
    const nextSorted = [...nextDayPrograms].sort((a, b) => a.START_TIME - b.START_TIME);
    return {
      rangeStart: sorted[0].START_TIME,
      rangeEnd:   nextSorted.length > 0 ? nextSorted[0].START_TIME : sorted[sorted.length - 1].END_TIME,
    };
  }, [programs, nextDayPrograms, watchingUnix]);

  const rangeDuration = Math.max(rangeEnd - rangeStart, 1);
  const progressPct   = Math.min(100, Math.max(0, ((watchingUnix - rangeStart) / rangeDuration) * 100));

  // ── HLS ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;
    hlsRef.current?.destroy();
    settingsService.current.detach();
    setIsBuffering(true);
    setCurrentTime(0);

    const tryPlay = () =>
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true; setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        settingsService.current.attach(hls);
        tryPlay();
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setIsBuffering(false);
      tryPlay();
    }
    return () => { hlsRef.current?.destroy(); settingsService.current.detach(); };
  }, [streamUrl]);

  // ── Video events ──────────────────────────────────────────────────────────────

  const modeRef      = useRef(mode);
  const archiveTsRef = useRef(archiveTimestamp);
  const onRewindRef  = useRef(onRewind);
  useEffect(() => { modeRef.current      = mode;             }, [mode]);
  useEffect(() => { archiveTsRef.current = archiveTimestamp; }, [archiveTimestamp]);
  useEffect(() => { onRewindRef.current  = onRewind;         }, [onRewind]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate  = () => setCurrentTime(video.currentTime);
    const onDurChange   = () => { if (isFinite(video.duration)) {} };
    const onPlay        = () => setIsPlaying(true);
    const onPause       = () => setIsPlaying(false);
    const onWaiting     = () => setIsBuffering(true);
    const onPlaying     = () => setIsBuffering(false);
    const onEnded = () => {
      if (modeRef.current === 'archive' && archiveTsRef.current !== null) {
        const resumeAt = archiveTsRef.current + Math.floor(video.currentTime);
        if (Math.floor(Date.now() / 1000) - resumeAt >= 5) onRewindRef.current(resumeAt);
      }
    };
    video.addEventListener('timeupdate',     onTimeUpdate);
    video.addEventListener('durationchange', onDurChange);
    video.addEventListener('loadedmetadata', onDurChange);
    video.addEventListener('play',           onPlay);
    video.addEventListener('pause',          onPause);
    video.addEventListener('waiting',        onWaiting);
    video.addEventListener('playing',        onPlaying);
    video.addEventListener('ended',          onEnded);
    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('durationchange', onDurChange);
      video.removeEventListener('loadedmetadata', onDurChange);
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPause);
      video.removeEventListener('waiting',        onWaiting);
      video.removeEventListener('playing',        onPlaying);
      video.removeEventListener('ended',          onEnded);
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
    if (videoRef.current) videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) { v.muted = false; v.volume = volume || 0.5; setIsMuted(false); }
    else         { v.muted = true;  v.volume = 0;             setIsMuted(true);  }
  };

  const skip = (seconds: number) => {
    const target = watchingUnix + seconds;
    const now    = Math.floor(Date.now() / 1000);
    if (seconds < 0) onRewind(Math.max(0, target));
    else if (mode === 'archive') target >= now ? onGoLive() : onRewind(target);
  };

  const toggleFullscreen = () => {
    !document.fullscreenElement
      ? containerRef.current?.requestFullscreen()
      : document.exitFullscreen();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden aspect-video w-full max-h-full ${isFullscreen ? '' : 'rounded-[10px]'}`}
        style={{ maxWidth: 'calc((100vh - 40px) * (16/9))' }}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
      >
        {/* ── Video ── */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* ── Spinner ── */}
        {(isLoading || isBuffering) && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 pointer-events-none">
            <CometRing />
          </div>
        )}

        {/* ── Fullscreen channel list ── */}
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

        {/* ── Controls layer ── */}
        <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

          {/* Fullscreen channels button */}
          {isFullscreen && (
            <button
  onClick={() => setShowChannels(v => !v)}
  className="pointer-events-auto absolute top-4 right-4
    text-white hover:text-[#d52b1e] cursor-pointer
    flex items-center justify-center w-9 h-9
    bg-black/60 backdrop-blur-sm rounded-lg border border-white/15"
>
  <span
    className="material-symbols-outlined pointer-events-none select-none"
    style={{ fontSize: '20px', display: 'block', lineHeight: 1 }}
  >
    list
  </span>
</button>
          )}

          {/* Center play controls — own absolute box, doesn't overlap bottom bar */}
          <div className="absolute left-0 right-0 flex items-center justify-center gap-6"
            style={{ top: '50%', transform: 'translateY(-50%)', bottom: 'auto' }}>
            <Btn icon="replay_10"  onClick={() => skip(-10)} title="−10s" size={28} />
            <Btn icon={isPlaying ? 'pause' : 'play_arrow'} onClick={togglePlay} size={42} fill />
            <Btn icon="forward_10" onClick={() => skip(10)}  title="+10s" size={28} />
          </div>

          {/* Bottom bar — own absolute box pinned to bottom */}
          <div className="absolute bottom-0 left-0 right-0 pb-3 px-3 pt-10
            bg-gradient-to-t from-black/90 via-black/40 to-transparent">

            {/* Go Live — sits above the bar */}
            {mode === 'archive' && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={onGoLive}
                  className="pointer-events-auto flex items-center gap-1.5 cursor-pointer
                    text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#d52b1e' }}
                >
                  <Icon name="sensors" size={16} fill />
                  Go Live
                </button>
              </div>
            )}

            {/* Single row: volume | clock | seekbar | right buttons */}
            <div className="pointer-events-auto flex items-center gap-2" onMouseEnter={cancelHide}>

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
                    {/* transparent bridge fills the gap between button and slider */}
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

              {/* Seekbar — flex-1 so it fills remaining space */}
              <div className="flex-1 h-4 flex items-center cursor-pointer" onClick={handleSeek}>
                <div className="relative w-full h-1 bg-white/25 rounded-full">
                  <div className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${progressPct}%`, backgroundColor: '#d52b1e' }} />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow"
                    style={{ left: `${progressPct}%`, backgroundColor: '#d52b1e' }} />
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