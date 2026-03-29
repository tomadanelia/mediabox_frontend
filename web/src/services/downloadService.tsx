import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' }
  | { ok: false; reason: 'error'; message: string };

export type DownloadRequest = {
  channelId: string;
  startTime: number; // unix seconds → sent as `start`
  endTime:   number; // unix seconds → duration = endTime - startTime
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calls GET /api/channels/:channelId/download?start=&duration=
 * The backend streams an MP4 directly, so we fetch it as a blob
 * and trigger a real browser "Save file" download.
 */
export async function requestDownload({
  channelId,
  startTime,
  endTime,
}: DownloadRequest): Promise<DownloadResult> {
  const duration = Math.round(endTime - startTime);

  try {
 const response = await api.get(`/api/channels/${channelId}/download`, {
  params: { 
    start: Math.round(startTime),   // ← add Math.round
    duration: Math.round(duration), // ← already rounded but be safe
  },
  responseType: 'blob',
  validateStatus: status => status < 500,
});

    if (response.status === 404) {
      return { ok: false, reason: 'unavailable' };
    }

    if (response.status !== 200) {
      return {
        ok: false,
        reason: 'error',
        message: `Unexpected response: HTTP ${response.status}`,
      };
    }

    // Build a temporary object URL and click-download it
    const blob     = new Blob([response.data], { type: 'video/mp4' });
    const url      = URL.createObjectURL(blob);
    const filename = `clip_${channelId}_${startTime}.mp4`;

    const anchor         = document.createElement('a');
    anchor.href          = url;
    anchor.download      = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Release the object URL after the browser has had time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 10_000);

    return { ok: true };

  } catch (err: any) {
    const status = err?.response?.status;

    // Network error or endpoint not yet deployed
    if (!status || status === 501 || status === 503) {
      return { ok: false, reason: 'unavailable' };
    }

    return {
      ok: false,
      reason: 'error',
      message: err?.response?.data?.message ?? err?.message ?? 'Something went wrong.',
    };
  }
}