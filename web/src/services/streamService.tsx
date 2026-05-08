/**
 * streamService.ts
 *
 * Singleton service that owns all stream URL fetching and caching.
 * The component never calls the backend for stream URLs directly —
 * it only calls getLiveUrl() / getArchiveUrl() here.
 *
 * Cache behaviour:
 *  • Live    — backend returns { url, expires_at }.
 *              We cache the URL and mark it stale STALE_BUFFER_SEC before expires_at.
 *              Switching back to a previously watched channel costs zero API calls
 *              as long as the token is still fresh.
 *
 *  • Archive — backend returns { url, length }.
 *              The two trailing numbers in the token are the SEEK WINDOW (rangeStart-rangeEnd),
 *              NOT a wall-clock expiry. The token stays valid for the whole session.
 *              We cache the prefix/suffix for ARCHIVE_CACHE_TTL_SEC (4 hours) and
 *              just swap the timestamp integer for every rewind/scrub — zero network cost.
 */

import api from '@/lib/axios';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Refresh live token this many seconds before expires_at. */
const STALE_BUFFER_SEC = 5 * 60;

/**
 * How long to trust a cached archive token before re-fetching.
 * Archive tokens are session-scoped (the CDN checks your cookie, not the timestamp),
 * so 4 hours is comfortably safe while keeping memory fresh.
 */
const ARCHIVE_CACHE_TTL_SEC = 4 * 60 * 60;

// ─── Internal types ───────────────────────────────────────────────────────────

type LiveEntry = {
  url: string;
  /** Unix seconds at which this entry is considered stale. */
  staleAt: number;
};

type ArchiveEntry = {
  /** Everything up to and including "video-timeshift_abs-" */
  prefix: string;
  /** Everything from ".m3u8" onward, including the full token query string */
  suffix: string;
  /** Unix seconds at which this entry is considered stale. */
  staleAt: number;
  /** How many hours back the server allows rewinding (from last fetch). */
  rewindableHours: number;
  /** The timestamp that was actually requested when this entry was cached. */
  lastRequestedTs: number;
};

// ─── Public return types ──────────────────────────────────────────────────────

export type LiveResult = {
  url: string;
};

export type ArchiveResult = {
  url: string;
  rewindableHours: number;
  anchorTimestamp: number;
};

// ─── Helpers (module-private) ─────────────────────────────────────────────────

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Parse the expiry unix timestamp from a LIVE streaming token URL.
 * Live token tails end with "-{rangeStart}-{expiry}" where expiry > now.
 */
function parseLiveTokenExpiry(url: string): number | null {
  const m = url.match(/-(\d+)-(\d+)$/);
  if (!m) return null;
  return parseInt(m[2], 10);
}

/**
 * Split an archive URL around the timeshift epoch integer.
 *
 * Input:  "https://cdn.../video-timeshift_abs-1773319316.m3u8?token=..."
 * Output: { prefix: "https://cdn.../video-timeshift_abs-",
 *           suffix: ".m3u8?token=..." }
 */
function parseArchiveUrl(url: string): { prefix: string; suffix: string } | null {
  const m = url.match(/^(.*-timeshift_abs-)(\d+)(\.m3u8.*)$/);
  if (!m) return null;
  return { prefix: m[1], suffix: m[3] };
}

function buildArchiveUrl(entry: ArchiveEntry, timestamp: number): string {
  return `${entry.prefix}${timestamp}${entry.suffix}`;
}

// ─── Cache stores (module-level singletons) ───────────────────────────────────

const liveCache: Record<string, LiveEntry> = {};
const archiveCache: Record<string, ArchiveEntry> = {};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a live stream URL for the given channel.
 *
 * Hits the backend only on first call per channel or after the token expires.
 * Subsequent calls while the token is still fresh return instantly from cache.
 */
export async function getLiveUrl(channelId: string): Promise<LiveResult> {
  const cached = liveCache[channelId];
  if (cached && nowSec() < cached.staleAt) {
    const ttl = cached.staleAt - nowSec();
    console.log(`🟢 [streamService] LIVE cache HIT  ch=${channelId}  ttl=${ttl}s`);
    return { url: cached.url };
  }

  console.log(`🔴 [streamService] LIVE cache MISS ch=${channelId} — fetching from backend`);
  const res = await api.get(`/api/channels/${channelId}/stream`);
  const data = res.data as { url: string; expires_at: string };

  const expiry = parseInt(data.expires_at, 10);
  if (!isNaN(expiry)) {
    liveCache[channelId] = {
      url: data.url,
      staleAt: expiry - STALE_BUFFER_SEC,
    };
    const ttl = expiry - STALE_BUFFER_SEC - nowSec();
    console.log(`🟡 [streamService] LIVE cached     ch=${channelId}  stale-in=${ttl}s  url=${data.url}`);
  } else {
    console.warn(`[streamService] LIVE could not parse expires_at — response:`, data);
  }

  return { url: data.url };
}

/**
 * Returns an archive stream URL for the given channel at the requested timestamp.
 *
 * On first call per channel (or after ARCHIVE_CACHE_TTL_SEC) fetches a fresh
 * signed URL from the backend, parses it into prefix/suffix, and caches that pair.
 *
 * On all subsequent calls within the TTL it swaps the timestamp integer into the
 * cached URL — zero network cost. This is what makes rewind/scrub instant.
 */
export async function getArchiveUrl(
  channelId: string,
  timestamp: number
): Promise<ArchiveResult> {
  const cached = archiveCache[channelId];
  if (cached && nowSec() < cached.staleAt) {
    const url = buildArchiveUrl(cached, timestamp);
    const ttl = cached.staleAt - nowSec();
    console.log(`🟢 [streamService] ARCHIVE cache HIT  ch=${channelId}  ts=${timestamp}  ttl=${ttl}s  url=${url}`);
    return {
      url,
      rewindableHours: cached.rewindableHours,
      anchorTimestamp: timestamp,
    };
  }

  console.log(`🔴 [streamService] ARCHIVE cache MISS ch=${channelId}  ts=${timestamp} — fetching from backend`);
  const res = await api.get(`/api/channels/${channelId}/archive`, {
    params: { timestamp },
  });
  const data = res.data as { url: string; length: string };

  const parsed = parseArchiveUrl(data.url);
  const rewindableHours = parseInt(data.length, 10) || 168;

  if (parsed) {
    const staleAt = nowSec() + ARCHIVE_CACHE_TTL_SEC;
    archiveCache[channelId] = {
      prefix: parsed.prefix,
      suffix: parsed.suffix,
      staleAt,
      rewindableHours,
      lastRequestedTs: timestamp, 
    };
    console.log(`🟡 [streamService] ARCHIVE cached     ch=${channelId}  stale-in=${ARCHIVE_CACHE_TTL_SEC}s  rewindableHours=${rewindableHours}  prefix=${parsed.prefix}`);
  } else {
    console.warn(`[streamService] ARCHIVE could not parse URL — response:`, data);
  }

  return { url: data.url, rewindableHours, anchorTimestamp: timestamp };
}

/**
 * Probes the archive endpoint (cheaply) to get the current rewindableHours
 * for a channel without actually switching to archive mode.
 * Uses the cache if warm — falls back to a real fetch otherwise.
 */
export async function probeRewindableHours(channelId: string): Promise<number> {
  const cached = archiveCache[channelId];
  if (cached && nowSec() < cached.staleAt) {
    console.log(`🟢 [streamService] PROBE cache HIT  ch=${channelId}  rewindableHours=${cached.rewindableHours}`);
    return cached.rewindableHours;
  }

  console.log(`🔴 [streamService] PROBE cache MISS ch=${channelId} — fetching from backend`);
  const probeTs = nowSec() - 10;
  const res = await api.get(`/api/channels/${channelId}/archive`, {
    params: { timestamp: probeTs },
  });
  const data = res.data as { url: string; length: string };

  const parsed = parseArchiveUrl(data.url);
  const rewindableHours = parseInt(data.length, 10) || 168;

  if (parsed) {
    const staleAt = nowSec() + ARCHIVE_CACHE_TTL_SEC;
    archiveCache[channelId] = {
      prefix: parsed.prefix,
      suffix: parsed.suffix,
      staleAt,
      rewindableHours,
      lastRequestedTs: probeTs, // ✅ fixed: was `timestamp` (undefined), now correctly `probeTs`
    };
    console.log(`🟡 [streamService] PROBE cached     ch=${channelId}  stale-in=${ARCHIVE_CACHE_TTL_SEC}s  rewindableHours=${rewindableHours}`);
  } else {
    console.warn(`[streamService] PROBE could not parse URL — response:`, data);
  }

  return rewindableHours;
}

/**
 * Evicts all cached entries for a channel.
 * Call this if the user explicitly logs out or loses access to a channel.
 */
export function evictChannel(channelId: string): void {
  delete liveCache[channelId];
  delete archiveCache[channelId];
}

/**
 * Evicts everything. Useful on logout.
 */
export function evictAll(): void {
  Object.keys(liveCache).forEach(k => delete liveCache[k]);
  Object.keys(archiveCache).forEach(k => delete archiveCache[k]);
}

/**
 * Builds a preview thumbnail URL for a given timestamp.
 * Preview URLs follow: /tv/{channel}/{YYYY}/{MM}/{DD}/{HH}/{mm}/{ss}-preview.mp4?token=...
 * The token is reused from the cached archive entry — zero extra API calls.
 */
export function getPreviewUrl(channelId: string | undefined, timestamp: number): string | null {
  if (!channelId) return null;
  const cached = archiveCache[channelId];

  // Extract the token query string from the suffix: ".m3u8?token=abc123..."
  const tokenMatch = cached.suffix.match(/\?(.*)/);
  if (!tokenMatch) return null;
  const tokenQS = tokenMatch[1]; // e.g. "token=abc123-..."

  // Convert unix timestamp to path segments
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm   = pad(d.getUTCMonth() + 1);
  const dd   = pad(d.getUTCDate());
  const hh   = pad(d.getUTCHours());
  const min  = pad(d.getUTCMinutes());
  const sec  = pad(d.getUTCSeconds());

  // Extract base CDN host + channel path from prefix
  // prefix looks like: "https://cdn.streamer.mediabox.ge/tv/meore_arkhi/video-timeshift_abs-"
  const prefixMatch = cached.prefix.match(/^(https:\/\/[^/]+\/tv\/[^/]+)\//);
  if (!prefixMatch) return null;
  const base = prefixMatch[1]; // "https://cdn.streamer.mediabox.ge/tv/meore_arkhi"

  return `${base}/${yyyy}/${mm}/${dd}/${hh}/${min}/${sec}-preview.mp4?${tokenQS}`;
}