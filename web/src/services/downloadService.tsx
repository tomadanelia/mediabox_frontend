/**
 * downloadService.ts
 *
 * Singleton service for clip/download requests.
 *
 * API contract (not yet available — will be wired when endpoint is ready):
 *   POST /api/channels/:channelId/download
 *        body: { start_time: number, end_time: number }
 *        → { job_id: string, status: 'queued' | 'processing' | 'ready', url?: string }
 *
 *   GET  /api/download/:jobId
 *        → { job_id: string, status: 'queued' | 'processing' | 'ready' | 'failed', url?: string }
 */

import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DownloadStatus = 'idle' | 'queued' | 'processing' | 'ready' | 'failed' | 'unavailable';

export type DownloadJob = {
  jobId: string;
  status: DownloadStatus;
  /** Populated when status === 'ready' */
  url?: string;
  channelId: string;
  startTime: number;
  endTime: number;
};

export type DownloadRequest = {
  channelId: string;
  startTime: number;
  endTime: number;
};

export type DownloadResult =
  | { ok: true; job: DownloadJob }
  | { ok: false; reason: 'unavailable' | 'error'; message: string };

// ─── Module state ─────────────────────────────────────────────────────────────

/** Active jobs keyed by jobId */
const jobs: Map<string, DownloadJob> = new Map();

/** Polling interval handles keyed by jobId */
const pollers: Map<string, ReturnType<typeof setInterval>> = new Map();

type JobSubscriber = (job: DownloadJob) => void;
const jobSubscribers: Map<string, Set<JobSubscriber>> = new Map();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function notifyJob(job: DownloadJob): void {
  jobSubscribers.get(job.jobId)?.forEach(fn => fn({ ...job }));
}

function stopPoller(jobId: string): void {
  const handle = pollers.get(jobId);
  if (handle !== undefined) {
    clearInterval(handle);
    pollers.delete(jobId);
  }
}

async function pollJob(jobId: string): Promise<void> {
  try {
    const res = await api.get(`/api/download/${jobId}`);
    const data = res.data as { job_id: string; status: string; url?: string };
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = data.status as DownloadStatus;
    if (data.url) job.url = data.url;
    jobs.set(jobId, job);
    notifyJob(job);

    if (job.status === 'ready' || job.status === 'failed') {
      stopPoller(jobId);
    }
  } catch {
    stopPoller(jobId);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Request a clip download.
 * Returns immediately with a result — either a job object or an unavailable/error result.
 * When the endpoint doesn't exist yet, returns { ok: false, reason: 'unavailable' }.
 */
export async function requestDownload(req: DownloadRequest): Promise<DownloadResult> {
  try {
    const res = await api.post(`/api/channels/${req.channelId}/download`, {
      start_time: req.startTime,
      end_time: req.endTime,
    });

    const data = res.data as { job_id: string; status: string; url?: string };
    const job: DownloadJob = {
      jobId: data.job_id,
      status: (data.status as DownloadStatus) ?? 'queued',
      url: data.url,
      channelId: req.channelId,
      startTime: req.startTime,
      endTime: req.endTime,
    };

    jobs.set(job.jobId, job);

    // Start polling if not immediately ready
    if (job.status !== 'ready' && job.status !== 'failed') {
      const handle = setInterval(() => pollJob(job.jobId), 3000);
      pollers.set(job.jobId, handle);
    }

    return { ok: true, job };
  } catch (err: any) {
    const status = err?.response?.status;

    // 404 / 501 / 503 → endpoint not implemented yet
    if (status === 404 || status === 501 || status === 503 || status === undefined) {
      return {
        ok: false,
        reason: 'unavailable',
        message: 'Download feature is not available yet.',
      };
    }

    return {
      ok: false,
      reason: 'error',
      message: err?.response?.data?.message ?? 'Something went wrong.',
    };
  }
}

/**
 * Subscribe to updates for a specific job.
 * Returns an unsubscribe function.
 */
export function subscribeJob(jobId: string, fn: JobSubscriber): () => void {
  if (!jobSubscribers.has(jobId)) jobSubscribers.set(jobId, new Set());
  jobSubscribers.get(jobId)!.add(fn);
  // Emit current state immediately if available
  const job = jobs.get(jobId);
  if (job) fn({ ...job });
  return () => jobSubscribers.get(jobId)?.delete(fn);
}

/**
 * Get a job snapshot by id.
 */
export function getJob(jobId: string): DownloadJob | undefined {
  return jobs.get(jobId);
}

/**
 * Cancel all pollers — call on unmount/logout.
 */
export function evictDownloads(): void {
  pollers.forEach((_, id) => stopPoller(id));
  jobs.clear();
  jobSubscribers.clear();
}