'use client'

import React, {
  useRef, useState, useEffect, useCallback,
} from 'react';
import Hls from 'hls.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** How long (ms) the cursor must be STILL before we load the preview stream. */
const DWELL_MS = 1_800;

const PREVIEW_W = 160;
const PREVIEW_H = 90;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPreviewTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function formatPreviewDate(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return '';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeekPreviewProps = {
  /** Unix-second timestamp the cursor is currently hovering. */
  timestamp: number;
  /** 0..1 horizontal progress along the seekbar. */
  progress: number;
  /** Width of the seekbar container (px). Used to clamp the tooltip. */
  containerWidth: number;
  /**
   * Async function returning a signed archive URL for the given timestamp.
   * Pass null for timestamp-only mode (live seekbar hover = no video panel).
   */
  resolveUrl: ((timestamp: number) => Promise<string>) | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const SeekPreview: React.FC<SeekPreviewProps> = ({
  timestamp,
  progress,
  containerWidth,
  resolveUrl,
}) => {
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const hlsRef      = useRef<Hls | null>(null);
  const dwellTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The latest hovered timestamp, kept in a ref so the dwell timer closure
  // always sees the freshest value without re-registering itself.
  const latestTsRef  = useRef<number>(timestamp);
  const loadedTsRef  = useRef<number | null>(null);

  const [committedTs, setCommittedTs] = useState<number | null>(null);
  const [videoReady,  setVideoReady]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  // Update the ref on every render so the timer closure is never stale.
  latestTsRef.current = timestamp;

  // ── Reschedule the dwell timer whenever the hovered timestamp moves ───────
  //
  // IMPORTANT: we do NOT list `timestamp` as a dep of a useEffect here.
  // Instead we compare with a ref and imperatively reset the timer.
  // This avoids re-creating the effect (and its cleanup) on every pixel move,
  // while still guaranteeing the timer resets correctly.
  const prevTsRef = useRef<number>(timestamp);
  if (prevTsRef.current !== timestamp) {
    prevTsRef.current = timestamp;

    // Clear any in-flight timer and start fresh
    if (dwellTimer.current) clearTimeout(dwellTimer.current);
    dwellTimer.current = setTimeout(() => {
      const ts = latestTsRef.current;
      if (loadedTsRef.current === ts) return; // already loaded this second
      setCommittedTs(ts);
    }, DWELL_MS);
  }

  // ── Load a new HLS preview whenever committedTs changes ──────────────────
  useEffect(() => {
    if (!resolveUrl || committedTs === null) return;

    let cancelled = false;
    setLoading(true);
    setVideoReady(false);

    resolveUrl(committedTs).then(url => {
      if (cancelled) return;
      loadedTsRef.current = committedTs;

      const video = videoRef.current;
      if (!video) { setLoading(false); return; }

      // Tear down the previous HLS instance
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.oncanplay = null;

      const onCanPlay = () => {
        if (!cancelled) { setLoading(false); setVideoReady(true); }
      };

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker:    true,
          lowLatencyMode:  false,   // archive — no need for low-latency
          maxBufferLength: 6,       // keep memory footprint tiny
          startLevel:      0,       // lowest quality = fastest first frame
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          video.muted        = true;
          video.volume       = 0;
          // The timeshift URL already positions the manifest at the right
          // wall-clock moment. currentTime=0 IS the requested timestamp.
          // Do NOT seek — just play from 0.
          video.currentTime  = 0;
          video.oncanplay    = onCanPlay;
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal && !cancelled) setLoading(false);
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src         = url;
        video.muted       = true;
        video.volume      = 0;
        video.currentTime = 0;
        video.oncanplay   = onCanPlay;
        video.play().catch(() => {});
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [committedTs, resolveUrl]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
      hlsRef.current?.destroy();
    };
  }, []);

  // ── Horizontal clamping ───────────────────────────────────────────────────
  const CARD_HALF = PREVIEW_W / 2 + 8;
  const rawLeft   = progress * containerWidth;
  const left      = Math.max(CARD_HALF, Math.min(containerWidth - CARD_HALF, rawLeft));

  const showVideoPanel = resolveUrl !== null;
  const dateLabel      = formatPreviewDate(timestamp);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:       'absolute',
        bottom:         '100%',
        left:           left,
        transform:      'translateX(-50%)',
        marginBottom:   10,
        zIndex:         50,
        pointerEvents:  'none',
        userSelect:     'none',
      }}
    >
      {/* Card */}
      <div
        style={{
          background:           'rgba(10,10,10,0.92)',
          backdropFilter:       'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius:         8,
          border:               '1px solid rgba(255,255,255,0.13)',
          overflow:             'hidden',
          width:                showVideoPanel ? PREVIEW_W : 'auto',
          minWidth:             showVideoPanel ? PREVIEW_W : 70,
        }}
      >
        {/* ── Video panel (archive mode only) ── */}
        {showVideoPanel && (
          <div
            style={{
              width:           PREVIEW_W,
              height:          PREVIEW_H,
              background:      '#000',
              position:        'relative',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              overflow:        'hidden',
            }}
          >
            {/* Video element — always mounted so the ref is stable */}
            <video
              ref={videoRef}
              style={{
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
                display:    'block',
                opacity:    videoReady ? 1 : 0,
                transition: 'opacity 0.25s ease',
              }}
              muted
              playsInline
            />

            {/* Loading spinner */}
            {loading && (
              <div style={{
                position:       'absolute',
                inset:          0,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width:          18,
                  height:         18,
                  border:         '2px solid rgba(255,255,255,0.15)',
                  borderTopColor: 'rgba(255,255,255,0.75)',
                  borderRadius:   '50%',
                  animation:      'sp-spin 0.65s linear infinite',
                }} />
              </div>
            )}

            {/* "hold still" nudge — shown before dwell fires */}
            {!loading && committedTs === null && (
              <span style={{
                position:   'absolute',
                color:      'rgba(255,255,255,0.32)',
                fontSize:   10,
                fontFamily: 'ui-monospace, monospace',
                textAlign:  'center',
                padding:    '0 8px',
                lineHeight: 1.4,
              }}>
                hold to preview
              </span>
            )}
          </div>
        )}

        {/* ── Timestamp label ── */}
        <div style={{
          padding:   showVideoPanel ? '5px 8px 6px' : '6px 10px',
          textAlign: 'center',
        }}>
          {dateLabel && (
            <div style={{
              color:        'rgba(255,255,255,0.4)',
              fontSize:     10,
              fontFamily:   'ui-monospace, monospace',
              marginBottom: 2,
              lineHeight:   1,
            }}>
              {dateLabel}
            </div>
          )}
          <div style={{
            color:         '#fff',
            fontSize:      13,
            fontFamily:    'ui-monospace, monospace',
            fontWeight:    500,
            letterSpacing: '0.03em',
            lineHeight:    1,
          }}>
            {formatPreviewTime(timestamp)}
          </div>
        </div>
      </div>

      {/* Caret pointing down to the seekbar */}
      <div style={{
        position:    'absolute',
        bottom:      -6,
        left:        '50%',
        transform:   'translateX(-50%)',
        width:       0,
        height:      0,
        borderLeft:  '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop:   '6px solid rgba(10,10,10,0.92)',
      }} />

      <style>{`@keyframes sp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SeekPreview;