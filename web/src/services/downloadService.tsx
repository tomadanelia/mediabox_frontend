import { getArchiveUrl, buildArchiveDownloadUrl } from '@/services/streamService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' }
  | { ok: false; reason: 'error'; message: string };

export type DownloadRequest = {
  channelId: string;
  startTime: number; // unix seconds
  endTime:   number; // unix seconds
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Downloads a clip directly from the CDN using the cached archive token.
 * URL format: {cdnBase}/archive-{startEpoch}-{durationSec}.mp4?token=...
 *
 * No backend download endpoint needed — the token from getArchiveUrl() is
 * already valid for the entire session and works for MP4 archive URLs too.
 */
export async function requestDownload({
  channelId,
  startTime,
  endTime,
}: DownloadRequest): Promise<DownloadResult> {
  const startTs   = Math.round(startTime);
  const duration  = Math.round(endTime - startTime);

  try {
    // Warm the cache (no-op if already warm)
    await getArchiveUrl(channelId, startTs);

    const url = buildArchiveDownloadUrl(channelId, startTs, duration);
    if (!url) return { ok: false, reason: 'unavailable' };

    // Fetch as blob so the browser triggers a Save dialog rather than playing it
    const response = await fetch(url);

    if (response.status === 404) return { ok: false, reason: 'unavailable' };
    if (!response.ok) {
      return { ok: false, reason: 'error', message: `HTTP ${response.status}` };
    }

    const blob      = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor    = document.createElement('a');
    anchor.href     = objectUrl;
    anchor.download = `clip_${channelId}_${startTs}_${duration}s.mp4`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

    return { ok: true };

  } catch (err: any) {
    const status = err?.response?.status;
    if (!status || status === 501 || status === 503) {
      return { ok: false, reason: 'unavailable' };
    }
    return {
      ok: false,
      reason: 'error',
      message: err?.message ?? 'Something went wrong.',
    };
  }
}