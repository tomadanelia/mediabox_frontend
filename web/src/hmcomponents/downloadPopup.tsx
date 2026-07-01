import Hls from 'hls.js';
import { useState, useRef, useCallback, useEffect } from 'react';
import { requestDownload } from '../../src/services/downloadService';
import type { DownloadResult } from '../../src/services/downloadService';
import { getArchiveUrl, getPreviewUrl, probeRewindableHours } from '@/services/streamService';
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

/** Parse "HH:MM:SS" into total seconds-of-day, returns null on bad input */
function parseTimeOfDay(str: string): number | null {
  const parts = str.trim().split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [h, m, s] = parts;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}

/** Replace the time-of-day component of a unix timestamp, keeping the date. */
function applyTimeOfDay(baseTs: number, todSec: number): number {
  const d = new Date(baseTs * 1000);
  const startOfDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
  return startOfDay + todSec;
}

const MAX_CLIP_SEC     = 3 * 60;
const DEFAULT_CLIP_SEC = 60;
const FRAME_COUNT      = 8;
const HANDLE_HIT_PX    = 16;
const HANDLE_WIDTH_PX  = 24;

const ZOOM_LEVELS = [
  60 * 60 * 24, 60 * 60 * 12, 60 * 60 * 6,
  60 * 60 * 2,  60 * 60,      60 * 30,
  60 * 10,      60 * 5,       60 * 2, 60,
];

// Index into ZOOM_LEVELS for the default starting zoom — 10 minutes.
const DEFAULT_ZOOM_IDX = ZOOM_LEVELS.indexOf(60 * 10);

interface DownloadPopupProps {
  channelId:        string | undefined;
  currentTimestamp: number | null;
  oldestTimestamp:  number;
  onClose:          () => void;
}

type Phase    = 'trim' | 'loading' | 'unavailable' | 'success' | 'error';
type DragMode = 'start' | 'end' | 'body' | null;

// ─── Editable time field ──────────────────────────────────────────────────────

interface TimeFieldProps {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  align:    'left' | 'right';
  onChange: (ts: number) => void;
}

const TimeField: React.FC<TimeFieldProps> = ({ label, value, min, max, align, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const startEdit = () => { setDraft(formatTime(value)); setEditing(true); };

  const commit = () => {
    setEditing(false);
    const tod = parseTimeOfDay(draft);
    if (tod === null) return;
    let ts = applyTimeOfDay(value, tod);
    // If the parsed time looks like it rolled past midnight, try adjacent day
    if (ts < min) ts += 86400;
    if (ts > max) ts -= 86400;
    ts = Math.max(min, Math.min(max, ts));
    onChange(ts);
  };

  return (
    <div className={`flex flex-col gap-0.5 ${align === 'right' ? '' : 'items-end'}`}>
      <span className="text-[9px] uppercase tracking-widest text-zinc-700">{label}</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { setEditing(false); }
          }}
          className="w-[72px] text-[11px] font-mono text-zinc-200 text-center
            bg-zinc-800 border border-zinc-600 rounded px-1 py-0.5 outline-none
            focus:border-red-600/60"
        />
      ) : (
        <button
          onClick={startEdit}
          title="Click to edit"
          className="text-[11px] font-mono cursor-pointer text-zinc-400 hover:text-zinc-200
            hover:bg-zinc-800/80 rounded px-1 py-0.5 transition-all text-left"
        >
          {formatTime(value)}
        </button>
      )}
    </div>
  );
};

// ─── TrimStrip ────────────────────────────────────────────────────────────────

interface TrimStripProps {
  channelId:   string | undefined;
  viewStart:   number;
  viewEnd:     number;
  start:       number;
  end:         number;
  absoluteMin: number;
  absoluteMax: number;
  onChange:    (newStart: number, newEnd: number, viewShift?: number) => void;
}

const TrimStrip: React.FC<TrimStripProps> = ({
  channelId,
  viewStart, viewEnd, start, end, absoluteMin, absoluteMax, onChange,
}) => {
  const ref  = useRef<HTMLDivElement>(null);
  const live = useRef({ viewStart, viewEnd, start, end, absoluteMin, absoluteMax, onChange });
  useEffect(() => { live.current = { viewStart, viewEnd, start, end, absoluteMin, absoluteMax, onChange }; });

  const [frameView,    setFrameView]    = useState({ start: viewStart, end: viewEnd });
  const isDragging                       = useRef(false);
  const lastFrameView                    = useRef({ start: viewStart, end: viewEnd });

  // Drives the CSS cursor on the strip container — updated on every
  // pointermove while not dragging (hover hit-test), and pinned to the
  // active mode while dragging.
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  useEffect(() => {
    if (isDragging.current) return;
    const prev = lastFrameView.current;
    if (prev.start === viewStart && prev.end === viewEnd) return;
    lastFrameView.current = { start: viewStart, end: viewEnd };
    setFrameView({ start: viewStart, end: viewEnd });
  }, [viewStart, viewEnd]);

  const drag = useRef<{
    mode:          DragMode;
    bodyOrigStart: number;
    bodyOrigEnd:   number;
    bodyStartX:    number;
    rafId:         number;
    currentX:      number;
  }>({ mode: null, bodyOrigStart: 0, bodyOrigEnd: 0, bodyStartX: 0, rafId: 0, currentX: 0 });

  const viewRange  = viewEnd - viewStart;
  const frameRange = frameView.end - frameView.start;

  const secToPct = (sec: number) =>
    Math.max(0, Math.min(100, ((sec - viewStart) / viewRange) * 100));

  const leftPct     = secToPct(start);
  const rightPct    = secToPct(end);
  const selWidthPct = rightPct - leftPct;
  const dur         = end - start;

  const clientXToSec = (clientX: number): number => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return live.current.viewStart;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    // Always return a whole second. This value flows directly into
    // start/end state and from there into archive stream URLs
    // (.../video-timeshift_abs-{timestamp}.m3u8) — a fractional timestamp
    // here produces a malformed URL the CDN 404s on (manifestLoadError),
    // which is what was actually breaking playback after the first scrub.
    return Math.round(live.current.viewStart + pct * (live.current.viewEnd - live.current.viewStart));
  };

  // Shared hit-test: given a clientX, figure out which drag mode (if any)
  // it falls on. Used both by onPointerDown (to start a drag) and by
  // onPointerMove (to drive hover cursor feedback) so the two never
  // disagree about hit regions.
  const getModeAtX = useCallback((clientX: number): DragMode => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    const l = live.current;

    const px     = clientX - rect.left;
    const w      = rect.width;
    const vRange = l.viewEnd - l.viewStart;
    const startPx = ((l.start - l.viewStart) / vRange) * w;
    const endPx   = ((l.end   - l.viewStart) / vRange) * w;

    // Correct hit centers: start handle is fully LEFT of startPx, end is fully RIGHT of endPx
    const startHandleCenter = startPx - HANDLE_WIDTH_PX / 2;
    const endHandleCenter   = endPx   + HANDLE_WIDTH_PX / 2;

    const nearStart = Math.abs(px - startHandleCenter) <= HANDLE_HIT_PX;
    const nearEnd   = Math.abs(px - endHandleCenter)   <= HANDLE_HIT_PX;

    if (nearStart && nearEnd) {
      return px <= (startHandleCenter + endHandleCenter) / 2 ? 'start' : 'end';
    } else if (nearStart) {
      return 'start';
    } else if (nearEnd) {
      return 'end';
    } else if (px > startPx - HANDLE_HIT_PX && px < endPx + HANDLE_HIT_PX) {
      return 'body';
    }
    return null;
  }, []);

  const modeToCursor = (mode: DragMode): string =>
    mode === 'start' || mode === 'end' ? 'ew-resize' :
    mode === 'body'                    ? 'grab' :
                                          'default';

  const runFrame = useCallback(() => {
    const d = drag.current;
    if (!d.mode) return;
    const l = live.current;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) { d.rafId = requestAnimationFrame(runFrame); return; }

    const vRange     = l.viewEnd - l.viewStart;
    const overLeft   = Math.max(0, rect.left  - d.currentX);
    const overRight  = Math.max(0, d.currentX - rect.right);
    const scrollSpeed = (overLeft + overRight) * 0.04;

    if (d.mode === 'start') {
      const targetSec = clientXToSec(d.currentX);
      // Clamp: can't go below absoluteMin, can't go within 1s of end,
      // and can't make the clip longer than MAX_CLIP_SEC
      const newStart = Math.max(
        l.absoluteMin,
        Math.max(l.end - MAX_CLIP_SEC, Math.min(l.end - 1, targetSec))
      );
      l.onChange(newStart, l.end);

    } else if (d.mode === 'end') {
      const targetSec = clientXToSec(d.currentX);
      const newEnd = Math.max(l.start + 1,
                      Math.min(l.absoluteMax,
                        Math.min(l.start + MAX_CLIP_SEC, targetSec)));
      l.onChange(l.start, newEnd);

    } else if (d.mode === 'body') {
      const totalDxPct = (d.currentX - d.bodyStartX) / rect.width;
      const totalDxSec = totalDxPct * vRange;
      const clipDur    = d.bodyOrigEnd - d.bodyOrigStart;
      let ns = d.bodyOrigStart + totalDxSec;
      let ne = ns + clipDur;

      if (ns < l.absoluteMin) { ns = l.absoluteMin; ne = l.absoluteMin + clipDur; }
      if (ne > l.absoluteMax) { ne = l.absoluteMax; ns = l.absoluteMax - clipDur; }

      let viewShift = 0;
      if (overLeft  > 0) viewShift = -scrollSpeed;
      if (overRight > 0) viewShift =  scrollSpeed;

      l.onChange(ns, ne, viewShift);
    }

    d.rafId = requestAnimationFrame(runFrame);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const mode = getModeAtX(e.clientX);
    if (!mode) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    setCursorStyle(mode === 'body' ? 'grabbing' : 'ew-resize');

    drag.current = {
      mode,
      bodyOrigStart: live.current.start,
      bodyOrigEnd:   live.current.end,
      bodyStartX:    e.clientX,
      rafId:         requestAnimationFrame(runFrame),
      currentX:      e.clientX,
    };
  }, [runFrame, getModeAtX]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    drag.current.currentX = e.clientX;
    if (!isDragging.current) {
      setCursorStyle(modeToCursor(getModeAtX(e.clientX)));
    }
  }, [getModeAtX]);

  const onPointerUp = useCallback(() => {
    cancelAnimationFrame(drag.current.rafId);
    drag.current.mode  = null;
    isDragging.current = false;
    setCursorStyle('default');
    const l = live.current;
    lastFrameView.current = { start: l.viewStart, end: l.viewEnd };
    setFrameView({ start: l.viewStart, end: l.viewEnd });
  }, []);

  useEffect(() => () => cancelAnimationFrame(drag.current.rafId), []);

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      style={{ height: '64px', cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Frame tiles */}
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        {Array.from({ length: FRAME_COUNT }).map((_, i) => {
          const ts  = Math.floor(frameView.start + (frameRange / FRAME_COUNT) * (i + 0.5));
          // Use a stable key so tiles don't remount on every render
          return (
            <FrameTile key={i} channelId={channelId} timestamp={ts} />
          );
        })}
      </div>

      {/* Dim outside selection */}
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        {leftPct > 0 && (
          <div className="absolute inset-y-0 left-0 bg-black/70"
            style={{ width: `${leftPct}%` }} />
        )}
        {rightPct < 100 && (
          <div className="absolute inset-y-0 right-0 bg-black/70"
            style={{ width: `${100 - rightPct}%` }} />
        )}
        <div className="absolute top-0 h-[2px] bg-red-600/80"
          style={{ left: `${leftPct}%`, width: `${selWidthPct}%` }} />
        <div className="absolute bottom-0 h-[2px] bg-red-600/80"
          style={{ left: `${leftPct}%`, width: `${selWidthPct}%` }} />
      </div>

      {/* START handle */}
      <div
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
        style={{
          left:          `${leftPct}%`,
          transform:     'translateX(-100%)',
          width:         `${HANDLE_WIDTH_PX}px`,
          cursor:        'ew-resize',
          pointerEvents: 'none',
        }}
      >
        <div className="w-full h-full flex items-center justify-center
          bg-zinc-900/95 border border-red-600 rounded-l-md shadow-lg shadow-black/60">
          <span className="text-red-500 font-light select-none" style={{ fontSize: '14px' }}>|</span>
        </div>
      </div>

      {/* END handle */}
      <div
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
        style={{
          left:          `${rightPct}%`,
          transform:     'translateX(0%)',
          width:         `${HANDLE_WIDTH_PX}px`,
          cursor:        'ew-resize',
          pointerEvents: 'none',
        }}
      >
        <div className="w-full h-full flex items-center justify-center
          bg-zinc-900/95 border border-red-600 rounded-r-md shadow-lg shadow-black/60">
          <span className="text-red-500 font-light select-none" style={{ fontSize: '14px' }}>|</span>
        </div>
      </div>

      {/* Duration badge */}
      {selWidthPct > 10 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none
            px-2 py-0.5 rounded-full bg-black/70 border border-zinc-700"
          style={{ left: `${leftPct + selWidthPct / 2}%` }}
        >
          <span className="text-[10px] font-mono text-zinc-300">{formatDuration(dur)}</span>
        </div>
      )}
    </div>
  );
};

// Stable thumbnail tile — only remounts when channelId or timestamp changes.
// Uses the single-frame preview mp4 (getPreviewUrl) instead of spinning up
// an HLS.js instance per tile — much cheaper for 8 tiles rendered at once.
const FrameTile: React.FC<{ channelId: string | undefined; timestamp: number }> = ({
  channelId, timestamp,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) { setPreviewUrl(null); return; }

    // Synchronous cache-backed lookup first — zero network cost if warm.
    const cached = getPreviewUrl(channelId, timestamp);
    if (cached) { setPreviewUrl(cached); return; }

    // Cache not warm yet for this channel — warm it once via a single
    // archive fetch, then derive the preview URL from the cached token.
    let cancelled = false;
    setPreviewUrl(null);
    getArchiveUrl(channelId, timestamp).then(() => {
      if (cancelled) return;
      setPreviewUrl(getPreviewUrl(channelId, timestamp));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [channelId, timestamp]);

  return (
    <div className="flex-1 h-full border-r border-white/[0.04] last:border-r-0 overflow-hidden bg-zinc-900">
      {previewUrl ? (
        <video
          key={previewUrl}
          src={previewUrl}
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-zinc-800" style={{ fontSize: '13px' }}>image</span>
        </div>
      )}
    </div>
  );
};

// ─── Clip Preview Player ──────────────────────────────────────────────────────

interface ClipPreviewProps {
  channelId:    string | undefined;
  timestamp:    number;
  archiveReady: boolean;
}

const ClipPreview: React.FC<ClipPreviewProps> = ({ channelId, timestamp, archiveReady }) => {
  const videoRef                  = useRef<HTMLVideoElement>(null);
  const hlsRef                    = useRef<Hls | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [paused,    setPaused]    = useState(false);

  // Resolve the stream URL for the current (debounced) timestamp.
  //
  // This mirrors Stream.tsx's goArchive(): a plain awaited getArchiveUrl()
  // call, nothing more. Earlier versions of this component tried to be
  // clever here — a synchronous fast-path via buildArchiveStreamUrl(),
  // ticket-based race handling via archiveUrlSequenced(), a separate
  // date-path URL builder — and each of those layers introduced its own
  // bug (white screen from a missing export, black flashes from premature
  // buffer clearing, stale frames from instance reuse). The main player
  // (VideoPlayer.tsx) does none of that: it just awaits getArchiveUrl()
  // on demand and lets a depended-on `streamUrl` state value drive the HLS
  // effect below. previewTs is already debounced 300ms upstream, so the
  // call frequency here is naturally low — no extra machinery needed.
  useEffect(() => {
    if (!channelId || !archiveReady) {
      console.log('🟡 [ClipPreview] skip resolve — no channelId/archiveReady', { channelId, archiveReady });
      setStreamUrl(null);
      return;
    }

    console.log('🔵 [ClipPreview] resolving archive url', { channelId, timestamp, clock: new Date(timestamp * 1000).toISOString() });

    let cancelled = false;
    getArchiveUrl(channelId, timestamp)
      .then(r => {
        if (cancelled) { console.log('⚪ [ClipPreview] resolve resolved but cancelled', { timestamp, url: r.url }); return; }
        console.log('🟢 [ClipPreview] resolved url', { timestamp, url: r.url });
        setStreamUrl(r.url);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('🔴 [ClipPreview] getArchiveUrl failed', { timestamp, err });
        setStreamUrl(null);
      });
    return () => { cancelled = true; };
  }, [channelId, timestamp, archiveReady]);

  // Attach/update HLS — mirrors VideoPlayer.tsx's main player effect
  // exactly: always destroy the previous Hls instance and build a fresh
  // one on every streamUrl change, loadSource + attachMedia together, play
  // once MANIFEST_PARSED fires. No instance reuse, no preload-then-swap,
  // no pending-url bookkeeping — that complexity was the source of the
  // black-screen/frozen-frame bugs, and the main player works correctly
  // without any of it.
  useEffect(() => {
    const vid = videoRef.current;
    console.log('🔵 [ClipPreview] HLS effect run', { streamUrl, hasVid: !!vid });

    if (!vid || !streamUrl) {
      if (hlsRef.current) {
        console.log('🟡 [ClipPreview] tearing down (no streamUrl/vid)');
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
      }
      hlsRef.current = null;
      if (vid) { vid.removeAttribute('src'); vid.load(); }
      return;
    }

    // Detach BEFORE destroy, and do it synchronously up front rather than
    // relying on the previous effect run's cleanup closure. hls.js's
    // destroy() can leave the <video> element in a state where a brand
    // new instance's attachMedia() on the same tick silently fails to
    // bind — explicitly detaching first avoids that race.
    if (hlsRef.current) {
      console.log('🟡 [ClipPreview] detaching+destroying previous hls instance before creating new one');
      hlsRef.current.detachMedia();
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let stale = false;

    if (Hls.isSupported()) {
      console.log('🔵 [ClipPreview] creating new Hls instance', { streamUrl });
      const hls = new Hls({ startPosition: 0, maxBufferLength: 10 });
      hlsRef.current = hls;
      hls.attachMedia(vid);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('🟢 [ClipPreview] MEDIA_ATTACHED', { streamUrl, stale });
        if (stale) return;
        hls.loadSource(streamUrl);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('🟢 [ClipPreview] MANIFEST_PARSED — calling play()', { streamUrl, stale });
        if (stale) return;
        setPaused(false);
        vid.play()
          .then(() => console.log('🟢 [ClipPreview] play() resolved', { streamUrl }))
          .catch(err => console.warn('🔴 [ClipPreview] play() rejected', { streamUrl, err }));
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        console.error('🔴 [ClipPreview] HLS ERROR', { streamUrl, fatal: data.fatal, type: data.type, details: data.details });
      });
    } else if (vid.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('🔵 [ClipPreview] using native HLS (Safari)', { streamUrl });
      vid.src = streamUrl;
      vid.onloadedmetadata = () => {
        console.log('🟢 [ClipPreview] native loadedmetadata — calling play()', { streamUrl, stale });
        if (stale) return;
        setPaused(false);
        vid.play()
          .then(() => console.log('🟢 [ClipPreview] native play() resolved', { streamUrl }))
          .catch(err => console.warn('🔴 [ClipPreview] native play() rejected', { streamUrl, err }));
      };
    } else {
      console.warn('🔴 [ClipPreview] neither hls.js nor native HLS supported');
    }

    return () => {
      console.log('🟡 [ClipPreview] effect cleanup — marking stale + tearing down', { streamUrl });
      stale = true;
      if (hlsRef.current) {
        hlsRef.current.detachMedia();
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Sync play/pause imperatively
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (paused) { vid.pause(); }
    else        { vid.play().catch(() => {}); }
  }, [paused]);

  useEffect(() => () => { hlsRef.current?.destroy(); }, []);

  const togglePause = () => setPaused(p => !p);

  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 relative group"
      style={{ aspectRatio: '16/9' }}
    >
      {streamUrl ? (
        <>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
          />

          {/* Click-to-pause overlay */}
          <button
            onClick={togglePause}
            className="absolute  cursor-pointer inset-0 w-full h-full flex items-center justify-center cursor-pointer bg-transparent"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label={paused ? 'Play' : 'Pause'}
          >
            <div className={`flex cursor-pointer items-center justify-center w-10 h-10 rounded-full
              bg-black/60 border border-white/15 backdrop-blur-sm
              transition-opacity duration-150
              ${paused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                {paused ? 'play_arrow' : 'pause'}
              </span>
            </div>
          </button>

          {/* Timestamp badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 border border-zinc-700/60 pointer-events-none">
            <span className="text-[10px] font-mono text-zinc-400">{formatTime(timestamp)}</span>
          </div>

          {paused && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 border border-zinc-700/60 pointer-events-none">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">დაპაუზებული</span>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span
            className="material-symbols-outlined text-zinc-800"
            style={{ fontSize: '28px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
          >
            movie
          </span>
          <span className="text-[10px] text-zinc-700 tracking-wide">Loading preview…</span>
        </div>
      )}
    </div>
  );
};
// ─── Main popup ───────────────────────────────────────────────────────────────

export const DownloadPopup: React.FC<DownloadPopupProps> = ({
  channelId, currentTimestamp, oldestTimestamp, onClose,
}) => {
  const nowRef = useRef(Math.floor(Date.now() / 1000));
  const now    = nowRef.current;
  const center = currentTimestamp ?? now - 60;

  const [start,      setStart]      = useState(() => Math.max(oldestTimestamp, center - DEFAULT_CLIP_SEC / 2));
  const [end,        setEnd]        = useState(() => Math.min(now,             center + DEFAULT_CLIP_SEC / 2));
  const [zoomIdx,    setZoomIdx]    = useState(DEFAULT_ZOOM_IDX);
  const [viewCenter, setViewCenter] = useState(center);

  const viewWindow = ZOOM_LEVELS[zoomIdx];
  const rawVS      = viewCenter - viewWindow / 2;
  const viewStart  = Math.max(oldestTimestamp, rawVS);
  const viewEnd    = Math.min(now, viewStart + viewWindow);

  const handleChange = useCallback((ns: number, ne: number, viewShift = 0) => {
    // Defense in depth: round here too, since this is the one chokepoint
    // every drag-driven start/end update flows through. clientXToSec()
    // already rounds, but body-drag math (totalDxSec etc.) does its own
    // arithmetic before calling this, so rounding again here guarantees
    // start/end — and therefore every archive URL built from them — are
    // always whole seconds.
    setStart(Math.round(ns));
    setEnd(Math.round(ne));
    if (viewShift !== 0) {
      setViewCenter(c => {
        const half = viewWindow / 2;
        const next = c + viewShift;
        return Math.max(oldestTimestamp + half, Math.min(now - half, next));
      });
    }
  }, [viewWindow, oldestTimestamp, now]);

  /** Zoom in/out re-centering the view on the current selection midpoint */
  const zoom = useCallback((delta: number) => {
    setZoomIdx(i => Math.max(0, Math.min(ZOOM_LEVELS.length - 1, i + delta)));
    setViewCenter((start + end) / 2);
  }, [start, end]);

  const clipDuration = end - start;
  const overMax      = clipDuration > MAX_CLIP_SEC;

  const [phase,    setPhase]    = useState<Phase>('trim');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = async () => {
    if (!channelId) return;
    setPhase('loading');
    const result: DownloadResult = await requestDownload({ channelId, startTime: start, endTime: end });
    if (!result.ok) {
      setPhase(result.reason === 'unavailable' ? 'unavailable' : 'error');
      if (result.reason === 'error') setErrorMsg(result.message);
    } else {
      setPhase('success');
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const [archiveReady, setArchiveReady] = useState(false);
  useEffect(() => {
    if (!channelId) return;
    probeRewindableHours(channelId)
      .then(() => setArchiveReady(true))
      .catch(() => setArchiveReady(true));
  }, [channelId]);

  // Debounced preview timestamp — only updates after user stops dragging
  const [previewTs,         setPreviewTs]         = useState(Math.round(start));
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      const rounded = Math.round(start);
      console.log('🔵 [DownloadPopup] previewTs settled', { start, rounded, clock: new Date(rounded * 1000).toISOString() });
      setPreviewTs(rounded);
    }, 300);
    return () => clearTimeout(previewDebounceRef.current);
  }, [start]);

  const zoomLabel = (() => {
    const s = viewWindow;
    if (s >= 3600) return `${s / 3600}h`;
    if (s >= 60)   return `${s / 60}m`;
    return `${s}s`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-black/80"
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-red-600"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
              download
            </span>
            <span className="text-sm font-semibold text-zinc-300 tracking-wide">გადმოწერე კლიპი</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              text-zinc-700 hover:text-zinc-400 hover:bg-zinc-800 transition-all cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>close</span>
          </button>
        </div>

        {/* TRIM */}
        {phase === 'trim' && (
          <div className="px-5 py-5 flex flex-col gap-4">

            <ClipPreview
              channelId={archiveReady ? channelId : undefined}
              timestamp={previewTs}
              archiveReady={archiveReady}
            />

            <div className="px-6">
              <TrimStrip
                channelId={archiveReady ? channelId : undefined}
                viewStart={viewStart} viewEnd={viewEnd}
                start={start} end={end}
                absoluteMin={oldestTimestamp} absoluteMax={now}
                onChange={handleChange}
              />
            </div>

            {/* Zoom + time row */}
            <div className="flex items-center gap-2">
              <button onClick={() => zoom(-1)}
                disabled={zoomIdx === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                  bg-zinc-900 border border-zinc-800 text-zinc-500
                  hover:text-zinc-300 hover:bg-zinc-800
                  disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
              </button>
              <span className="text-[10px] font-mono text-zinc-700 w-8 text-center">{zoomLabel}</span>
              <button onClick={() => zoom(1)}
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                  bg-zinc-900 border border-zinc-800 text-zinc-500
                  hover:text-zinc-300 hover:bg-zinc-800
                  disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
              </button>

              <div className="flex-1" />

              <div className="flex items-center gap-3">
                <TimeField
                  label="Start"
                  value={start}
                  min={oldestTimestamp}
                  max={end - 1}
                  align="right"
                  onChange={ts => {
                    const ns = Math.max(oldestTimestamp, Math.max(end - MAX_CLIP_SEC, Math.min(end - 1, ts)));
                    setStart(ns);
                    setViewCenter((ns + end) / 2);
                  }}
                />
                <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono
                  ${overMax ? 'bg-red-500/12 text-red-500 border border-red-500/25'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                  {formatDuration(clipDuration)}
                </div>
                <TimeField
                  label="End"
                  value={end}
                  min={start + 1}
                  max={now}
                  align="left"
                  onChange={ts => {
                    const ne = Math.max(start + 1, Math.min(now, Math.min(start + MAX_CLIP_SEC, ts)));
                    setEnd(ne);
                    setViewCenter((start + ne) / 2);
                  }}
                />
              </div>
            </div>

            {overMax && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/6 border border-red-500/18">
                <span className="material-symbols-outlined text-red-500" style={{ fontSize: '14px' }}>warning</span>
                <span className="text-xs text-red-500/80">მაქსიმალური სიგრძეა {formatDuration(MAX_CLIP_SEC)}</span>
              </div>
            )}

            {/* Presets */}
            <div className="flex gap-2">
              {[{ label: '30 წამი', sec: 30 }, { label: '1 წუთი', sec: 60 }, { label: '2 წუთი', sec: 120 }, { label: '3 წუთი', sec: 180 }].map(p => (
                <button key={p.label}
                  onClick={() => {
                    const s = Math.max(oldestTimestamp, center - p.sec / 2);
                    const e = Math.min(now, s + p.sec);
                    setStart(s); setEnd(e);
                    setViewCenter((s + e) / 2);
                    const needed = p.sec * 3;
                    const idx = ZOOM_LEVELS.slice().reverse().findIndex(z => z >= needed);
                    if (idx !== -1) setZoomIdx(ZOOM_LEVELS.length - 1 - idx);
                  }}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-medium
                    bg-zinc-900 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400
                    border border-zinc-800 hover:border-zinc-700 transition-all duration-150 cursor-pointer">
                  {p.label}
                </button>
              ))}
            </div>

            <button onClick={handleDownload} disabled={overMax || !channelId}
              className="w-full h-10 rounded-xl text-sm font-semibold
                flex items-center justify-center gap-2
                bg-red-600 hover:bg-red-500 active:bg-red-700
                disabled:bg-zinc-800 disabled:text-zinc-700 disabled:cursor-not-allowed
                text-white transition-all duration-150 cursor-pointer">
              <span className="material-symbols-outlined"
                style={{ fontSize: '17px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                download
              </span>
              გადმოწერა {formatDuration(clipDuration)}
            </button>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div className="px-5 py-14 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-800 border-t-red-600 animate-spin" />
            <p className="text-xs text-zinc-600">კლიპი მზადდება…</p>
          </div>
        )}

        {/* UNAVAILABLE */}
        {phase === 'unavailable' && (
          <div className="px-5 py-8 flex flex-col items-center gap-5 text-center">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-red-600/8" />
              <div className="absolute inset-2.5 rounded-full bg-red-600/8" />
              <span className="material-symbols-outlined text-red-600 relative"
                style={{ fontSize: '26px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                cloud_off
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-zinc-300">Not Available Yet</p>
              <p className="text-xs text-zinc-600 max-w-[230px] leading-relaxed">
                Download is coming soon — trim and save archive clips.
              </p>
            </div>
            <div className="w-full flex flex-col gap-1.5">
              {[{ icon: 'cut', label: 'Trim to exact moment' }, { icon: 'hd', label: 'HD quality export' }, { icon: 'schedule', label: 'Up to 3 minutes' }].map(f => (
                <div key={f.icon} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <span className="material-symbols-outlined text-zinc-700"
                    style={{ fontSize: '15px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>{f.icon}</span>
                  <span className="text-xs text-zinc-600">{f.label}</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-700 border border-zinc-700">Soon</span>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-full h-9 rounded-xl text-sm font-medium
                bg-zinc-900 hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400
                border border-zinc-800 hover:border-zinc-700 transition-all duration-150">
              Got it
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600"
                style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>error</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-300">Download Failed</p>
              <p className="text-xs text-zinc-600">{errorMsg}</p>
            </div>
            <button onClick={() => setPhase('trim')}
              className="w-full h-9 rounded-xl text-sm font-medium
                bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300
                border border-zinc-800 transition-all duration-150">
              Try again
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {phase === 'success' && (
          <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500"
                style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>check_circle</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-zinc-300">რიგშია</p>
              <p className="text-xs text-zinc-600">როცა მზად იქნება,შეგატყობინებთ</p>
            </div>
            <button onClick={onClose}
              className="w-full h-9 rounded-xl text-sm font-medium
                bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300
                border border-zinc-800 transition-all duration-150 cursor-pointer">
              გადმოწერა დასრულდა
            </button>
          </div>
        )}

      </div>
    </div>
  );
};