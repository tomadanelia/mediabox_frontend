'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Hls from 'hls.js';
import BadgeLiveDemo from '@/components/shadcn-studio/badge/cusotm/badge-c01';
import { CometRing } from './AnimatedComponents/CometBuffer';
import {
  ArrowsPointingOutIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import {
  Play, Pause,
  RotateCcw, RotateCw, ScreenShare,
  PictureInPicture2, Forward, Radio,
} from 'lucide-react';
import FullScreenList from './FullScreenList'

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
  /** Program list for the current day — used to compute timeline range */
  programs?: ProgramItem[];
  /** First program(s) of next day — defines the right edge of the range */
  nextDayPrograms?: ProgramItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatClock(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function formatBehind(secs: number): string {
  if (secs < 60) return `${Math.floor(secs)}s behind live`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m behind live`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m behind live`;
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
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const containerRef  = useRef<HTMLDivElement | null>(null);
  const hlsRef        = useRef<Hls | null>(null);

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

  const [liveNow, setLiveNow] = useState(Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setLiveNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const watchingUnix   = getWatchingUnix(mode, liveNow, archiveTimestamp, currentTime);
  const behindLiveSecs = mode === 'archive' ? Math.max(0, liveNow - watchingUnix) : 0;

  // ─── Program-based range ─────────────────────────────────────────────────────
  // rangeStart: first program's START_TIME
  // rangeEnd:   first program of next day's START_TIME, or last program's END_TIME
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (!programs.length) {
      // Fallback: midnight-to-midnight of the watched day
      const d = new Date(watchingUnix * 1000);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
      return { rangeStart: midnight, rangeEnd: midnight + 86400 };
    }
    const sorted = [...programs].sort((a, b) => a.START_TIME - b.START_TIME);
    const start  = sorted[0].START_TIME;
    const lastEnd = sorted[sorted.length - 1].END_TIME;

    const nextSorted = [...nextDayPrograms].sort((a, b) => a.START_TIME - b.START_TIME);
    const end = nextSorted.length > 0 ? nextSorted[0].START_TIME : lastEnd;

    return { rangeStart: start, rangeEnd: end };
  }, [programs, nextDayPrograms, watchingUnix]);

  const rangeDuration = Math.max(rangeEnd - rangeStart, 1);

  /** Where the current watching position sits in the program range (0–100) */
  const progressPct = Math.min(100, Math.max(0,
    ((watchingUnix - rangeStart) / rangeDuration) * 100
  ));

  // ── Load HLS ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(0);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
          });
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
      video.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        });
    }

    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [streamUrl]);

  // ── Video events ─────────────────────────────────────────────────────────────

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
        if (nowSec - resumeAt >= 5) {
          onRewindRef.current(resumeAt);
        }
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

  const modeRef      = useRef(mode);
  const archiveTsRef = useRef(archiveTimestamp);
  const onRewindRef  = useRef(onRewind);
  useEffect(() => { modeRef.current      = mode;             }, [mode]);
  useEffect(() => { archiveTsRef.current = archiveTimestamp; }, [archiveTimestamp]);
  useEffect(() => { onRewindRef.current  = onRewind;         }, [onRewind]);

  // ── Fullscreen ───────────────────────────────────────────────────────────────

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

  /**
   * Seek by clicking the progress bar.
   * Maps click position to a unix timestamp within the PROGRAM range,
   * so it stays on the correct day regardless of whether it's today or a past day.
   */
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect    = e.currentTarget.getBoundingClientRect();
    const pct     = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const targetTs = Math.floor(rangeStart + pct * rangeDuration);
    const nowSec   = Math.floor(Date.now() / 1000);

    // Don't seek into the future
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
      if (target >= nowSec) {
        onGoLive();
      } else {
        onRewind(target);
      }
    }
  };

  const toggleFullscreen = () => {
    !document.fullscreenElement
      ? containerRef.current?.requestFullscreen()
      : document.exitFullscreen();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex w-full relative justify-center px-4">
      <div className="w-full flex flex-row max-w-6xl rounded-sm">
        <div
          ref={containerRef}
          className="relative bg-black group rounded-[10px] overflow-hidden w-full"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => { setShowControls(false); setShowVolumeSlider(false); }}
        >
          <video ref={videoRef} className="w-full aspect-video" onClick={togglePlay} />

          {/* Spinner */}
          {(isLoading || isBuffering) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
              <div className='rounded-full'><CometRing /></div>
            </div>
          )}

          {/* Archive: Go Live button */}
          {mode === 'archive' && (
            <div className="absolute bottom-12 right-6 flex items-center justify-center gap-3 z-20 pointer-events-none">
              <button
                onClick={onGoLive}
                className="pointer-events-auto cursor-pointer flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                <Radio className="w-3.5 h-3.5" />
                Go Live
              </button>
            </div>
          )}

          {/* Fullscreen channels */}
          {isFullscreen && (
            <button
              onClick={() => setShowChannels(!showChannels)}
              className={`absolute top-6 right-6 z-50 text-white hover:text-orange-400 transition-all cursor-pointer px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              Channels
            </button>
          )}
          {isFullscreen && showChannels && (
            <FullScreenList
              onClose={() => setShowChannels(false)}
              onSelect={(ev) => {
                onChannelSelect?.(ev.channel)
                if (ev.mode === 'archive' && ev.timestamp !== undefined) {
                  onRewind(ev.timestamp)
                }
              }}
              currentChannelId={currentChannelId}
              rewindableDays={rewindableDays}
            />
          )}

          {/* Controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 h-full flex justify-center items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-4 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

            {/* Bottom bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-4 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-center gap-4">

                {/* Volume + time */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div
                    className='relative w-6 h-6'
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button onClick={toggleMute} className="text-white w-6 h-6">
                      {isMuted
                        ? <SpeakerXMarkIcon className="w-6 h-6 cursor-pointer" />
                        : <SpeakerWaveIcon className="w-6 h-6 cursor-pointer" />
                      }
                    </button>
                    {showVolumeSlider && (
                      <>
                        <div className='absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-6' />
                        <div className='absolute bottom-10 left-1/2 -translate-x-1/2'>
                          <div className='h-40 w-6 rounded-sm bg-gray-400/20 backdrop-blur-sm p-1 flex items-center justify-center'>
                            <div
                              className="absolute w-2 bottom-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                              style={{ height: `${(isMuted ? 0 : volume) * 80}%` }}
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

                  <div className="flex items-center gap-1.5 text-white text-sm font-mono">
                    {mode === 'live' && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                    {formatClock(watchingUnix)}
                  </div>
                </div>

                {/* ── Progress bar (program-range based) ── */}
                <div className="flex-1 h-6 flex items-center">
                  <div
                    className="w-full h-1 bg-white/30 rounded-full cursor-pointer relative"
                    onClick={handleSeek}
                  >
                    <div
                      className={`h-full rounded-full ${
                        mode === 'live'
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow ${
                        mode === 'live' ? 'bg-red-400' : 'bg-orange-400'
                      }`}
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => skip(-30)} className="text-white cursor-pointer" title="Rewind 30s">
                    <Forward className="w-6 h-6" />
                  </button>
                  <button onClick={() => skip(30)} className="text-white cursor-pointer" title="Forward 30s">
                    <PictureInPicture2 className="w-6 h-6" />
                  </button>
                  <button onMouseEnter={() => console.log("not implemented")} className="text-white cursor-default">
                    <ScreenShare className="w-6 h-6 opacity-40" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white relative cursor-pointer">
                    <ArrowsPointingOutIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center playback controls */}
            <div className="flex absolute items-center h-full top-0 justify-center gap-6">
              <button onClick={() => skip(-10)} className="text-white hover:text-orange-400 transition-colors" title="Rewind 10s">
                <RotateCcw className="w-7 h-7" />
              </button>
              <button onClick={togglePlay} className="text-white hover:text-orange-400 transition-colors">
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10" />}
              </button>
              <button onClick={() => skip(10)} className="text-white hover:text-orange-400 transition-colors" title="Forward 10s">
                <RotateCw className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;