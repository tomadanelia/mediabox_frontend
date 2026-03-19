'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Hls from 'hls.js';
import { CometRing } from './AnimatedComponents/CometBuffer';
import FullScreenList from './FullScreenList';
import { SettingsButton } from './settingsButton';
import { PlayerSettingsService } from './playerSettingsService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string
  uuid: string
  name: string
  logo: string
  number: number
  category: string
  category_id: string
}

type ProgramItem = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number
  END_TIME: number
  TITLE: string
  GANRE?: string
  DESCRIPTION?: string
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatClock(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function getWatchingUnix(
  mode: 'live' | 'archive',
  liveNow: number,
  archiveTimestamp: number | null,
  currentTime: number,
): number {
  if (mode === 'archive' && archiveTimestamp !== null) {
    return archiveTimestamp + Math.floor(currentTime);
  }
  return liveNow;
}

// ─── Material icon helper ─────────────────────────────────────────────────────

const MI = ({
  name, size = 20, fill = false, className = '', style = {},
}: {
  name: string; size?: number; fill?: boolean; className?: string; style?: React.CSSProperties;
}) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontSize: size,
      display: 'block',
      fontVariationSettings: fill
        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
        : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      lineHeight: 1,
      userSelect: 'none',
      ...style,
    }}
  >
    {name}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  mode,
  archiveTimestamp,
  isLoading = false,
  onRewind,
  onGoLive,
  onChannelSelect,
  currentChannelId,
  rewindableDays,
  channels = [],
  programs = [],
  nextDayPrograms = [],
}) => {
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef       = useRef<Hls | null>(null);

  const [isPlaying,        setIsPlaying]        = useState(false);
  const [currentTime,      setCurrentTime]      = useState(0);
  const [duration,         setDuration]         = useState(0);
  const [volume,           setVolume]           = useState(1);
  const [isMuted,          setIsMuted]          = useState(false);
  const [showControls,     setShowControls]     = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen,     setIsFullscreen]     = useState(false);
  const [showChannels,     setShowChannels]     = useState(false);
  const [isBuffering,      setIsBuffering]      = useState(false);

  const settingsService = useRef(new PlayerSettingsService());

  const [liveNow, setLiveNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const watchingUnix = getWatchingUnix(mode, liveNow, archiveTimestamp, currentTime);

  // ─── Program-based range ──────────────────────────────────────────────────────

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (!programs.length) {
      const d = new Date(watchingUnix * 1000);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
      return { rangeStart: midnight, rangeEnd: midnight + 86400 };
    }
    const sorted     = [...programs].sort((a, b) => a.START_TIME - b.START_TIME);
    const start      = sorted[0].START_TIME;
    const lastEnd    = sorted[sorted.length - 1].END_TIME;
    const nextSorted = [...nextDayPrograms].sort((a, b) => a.START_TIME - b.START_TIME);
    const end        = nextSorted.length > 0 ? nextSorted[0].START_TIME : lastEnd;
    return { rangeStart: start, rangeEnd: end };
  }, [programs, nextDayPrograms, watchingUnix]);

  const rangeDuration = Math.max(rangeEnd - rangeStart, 1);
  const progressPct   = Math.min(100, Math.max(0,
    ((watchingUnix - rangeStart) / rangeDuration) * 100
  ));

  // ── Load HLS ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    settingsService.current.detach();
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(0);

    const tryPlay = () =>
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
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
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad();         break;
            case Hls.ErrorTypes.MEDIA_ERROR:   hls.recoverMediaError(); break;
            default:                           hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setIsBuffering(false);
      tryPlay();
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      settingsService.current.detach();
    };
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

    const onTimeUpdate     = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => { if (isFinite(video.duration)) setDuration(video.duration); };
    const onPlay           = () => setIsPlaying(true);
    const onPause          = () => setIsPlaying(false);
    const onWaiting        = () => setIsBuffering(true);
    const onPlaying        = () => setIsBuffering(false);
    const onEnded = () => {
      if (modeRef.current === 'archive' && archiveTsRef.current !== null) {
        const resumeAt = archiveTsRef.current + Math.floor(video.currentTime);
        const nowSec   = Math.floor(Date.now() / 1000);
        if (nowSec - resumeAt >= 5) onRewindRef.current(resumeAt);
      }
    };

    video.addEventListener('timeupdate',     onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('loadedmetadata', onDurationChange);
    video.addEventListener('play',           onPlay);
    video.addEventListener('pause',          onPause);
    video.addEventListener('waiting',        onWaiting);
    video.addEventListener('playing',        onPlaying);
    video.addEventListener('ended',          onEnded);

    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('loadedmetadata', onDurationChange);
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPause);
      video.removeEventListener('waiting',        onWaiting);
      video.removeEventListener('playing',        onPlaying);
      video.removeEventListener('ended',          onEnded);
    };
  }, []);

  // ── Fullscreen ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ─── Controls ─────────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect     = e.currentTarget.getBoundingClientRect();
    const pct      = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetTs = Math.floor(rangeStart + pct * rangeDuration);
    const nowSec   = Math.floor(Date.now() / 1000);
    if (targetTs >= nowSec) return;
    onRewind(targetTs);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted  = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted  = true;
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const target = watchingUnix + seconds;
    const nowSec = Math.floor(Date.now() / 1000);
    if (seconds < 0) {
      onRewind(Math.max(0, target));
    } else if (seconds > 0 && mode === 'archive') {
      target >= nowSec ? onGoLive() : onRewind(target);
    }
  };

  const toggleFullscreen = () => {
    !document.fullscreenElement
      ? containerRef.current?.requestFullscreen()
      : document.exitFullscreen();
  };

  // ── Icon button helper ────────────────────────────────────────────────────────

  const IconBtn = ({
    icon, onClick, title, size = 20, fill = false, disabled = false,
  }: {
    icon: string; onClick?: () => void; title?: string;
    size?: number; fill?: boolean; disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="text-white hover:text-[#d52b1e] cursor-pointer disabled:opacity-30 disabled:cursor-default flex items-center justify-center w-8 h-8"
    >
      <div className="pointer-events-none flex items-center justify-center" style={{ width: size, height: size }}>
        <MI name={icon} size={size} fill={fill} className="pointer-events-none" />
      </div>
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div
        ref={containerRef}
        className={`
          relative bg-black rounded-[10px] overflow-hidden
          aspect-video w-full max-h-full
          ${isFullscreen ? 'rounded-none' : ''}
        `}
        style={{ maxWidth: 'calc((100vh - 40px) * (16/9))' }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => { setShowControls(false); setShowVolumeSlider(false); }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full"
          onClick={togglePlay}
        />

        {/* Spinner */}
        {(isLoading || isBuffering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <div className="rounded-full"><CometRing /></div>
          </div>
        )}

        {/* Archive: Go Live button */}
        {mode === 'archive' && (
          <div className="absolute bottom-12 right-6 flex items-center justify-center gap-3 z-20 pointer-events-none">
            <button
              onClick={onGoLive}
              className="pointer-events-auto cursor-pointer flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ backgroundColor: '#d52b1e' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b82419')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#d52b1e')}
            >
              <MI name="sensors" size={18} fill />
              Go Live
            </button>
          </div>
        )}

        {/* Fullscreen channels toggle */}
        {isFullscreen && (
          <button
            onClick={() => setShowChannels(!showChannels)}
            className={`absolute top-6 right-6 z-50 text-white transition-all cursor-pointer px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            onMouseEnter={e => (e.currentTarget.style.color = '#d52b1e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'white')}
          >
            Channels
          </button>
        )}
        {isFullscreen && showChannels && (
          <FullScreenList
            onClose={() => setShowChannels(false)}
            onSelect={(ev) => {
              onChannelSelect?.(ev.channel);
              if (ev.mode === 'archive' && ev.timestamp !== undefined) {
                onRewind(ev.timestamp);
              }
            }}
            currentChannelId={currentChannelId}
            rewindableDays={rewindableDays}
          />
        )}

        {/* Controls overlay */}
        <div
  className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
>
          {/* Center playback controls */}
          <div className="absolute h-full w-full flex items-center justify-center gap-6">
            <IconBtn icon="replay_10"  onClick={() => skip(-10)} title="Rewind 10s"  size={28} />
            <IconBtn icon={isPlaying ? 'pause' : 'play_arrow'} onClick={togglePlay} size={40} fill />
            <IconBtn icon="forward_10" onClick={() => skip(10)}  title="Forward 10s" size={28} />
          </div>

          {/* Bottom bar */}
          <div className="bg-gradient-to-t absolute w-full bottom-0 from-black/90 via-black/40 to-transparent px-4 pb-3 pt-10">
            <div className="flex items-center gap-3">

              {/* Volume */}
              <div
                className="relative flex-shrink-0"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="text-white w-6 h-6 flex items-center justify-center"
                >
                  <MI name={isMuted ? 'volume_off' : 'volume_up'} size={22} fill={isMuted} />
                </button>
                {showVolumeSlider && (
                  <>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-6" />
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                      <div className="h-40 w-6 rounded-sm bg-gray-400/20 backdrop-blur-sm p-1 flex items-center justify-center">
                        <div
                          className="absolute w-2 bottom-4 rounded-full"
                          style={{
                            height: `${(isMuted ? 0 : volume) * 80}%`,
                            background: '#d52b1e',
                          }}
                        />
                        <input
                          type="range" min="0" max="1" step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-36 h-2 absolute appearance-none rounded-full cursor-pointer border-none outline-none -rotate-90"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Clock */}
              <div className="flex items-center gap-1.5 text-white text-sm font-mono flex-shrink-0">
                {mode === 'live' && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                )}
                {formatClock(watchingUnix)}
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-6 flex items-center">
                <div
                  className="w-full h-1 bg-white/30 rounded-full cursor-pointer relative"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progressPct}%`, backgroundColor: '#d52b1e' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow"
                    style={{ left: `${progressPct}%`, backgroundColor: '#d52b1e' }}
                  />
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <IconBtn icon="replay_30"  onClick={() => skip(-30)} title="Rewind 30s"  size={20} />
                <IconBtn icon="forward_30" onClick={() => skip(30)}  title="Forward 30s" size={20} />
                <IconBtn icon="cast"       disabled title="Cast"    size={20} />
                <SettingsButton service={settingsService.current} />
                <IconBtn icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} onClick={toggleFullscreen} size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;