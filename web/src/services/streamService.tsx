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

/**
 * Splits the token query string + CDN base out of a cached ArchiveEntry,
 * the same way getPreviewUrl() does internally. Shared by getPreviewUrl()
 * and buildArchiveStreamUrlByDatePath() so both date-path URL builders stay
 * in sync instead of duplicating this parsing twice.
 */
function extractTokenAndBase(entry: ArchiveEntry): { tokenQS: string; base: string } | null {
  const tokenMatch = entry.suffix.match(/\?(.*)/);
  if (!tokenMatch) return null;
  const tokenQS = tokenMatch[1];

  const prefixMatch = entry.prefix.match(/^(https:\/\/[^/]+\/tv\/[^/]+)\//);
  if (!prefixMatch) return null;
  const base = prefixMatch[1];

  return { tokenQS, base };
}

/** Converts a unix timestamp into the zero-padded UTC path segments used in CDN URLs. */
function timestampToDatePathSegments(timestamp: number) {
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    yyyy: d.getUTCFullYear(),
    mm:   pad(d.getUTCMonth() + 1),
    dd:   pad(d.getUTCDate()),
    hh:   pad(d.getUTCHours()),
    min:  pad(d.getUTCMinutes()),
    sec:  pad(d.getUTCSeconds()),
  };
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
  if (!cached) return null;

  const parts = extractTokenAndBase(cached);
  if (!parts) return null;
  const { tokenQS, base } = parts;

  const { yyyy, mm, dd, hh, min, sec } = timestampToDatePathSegments(timestamp);

  return `${base}/${yyyy}/${mm}/${dd}/${hh}/${min}/${sec}-preview.mp4?${tokenQS}`;
}

/**
 * Builds a playable HLS (.m3u8) archive stream URL for an arbitrary
 * timestamp, using the SAME date-path convention as getPreviewUrl() —
 * {cdnBase}/{YYYY}/{MM}/{DD}/{HH}/{mm}/{ss}.m3u8?{tokenQS} — instead of the
 * epoch-swap "video-timeshift_abs-{timestamp}.m3u8" pattern that
 * buildArchiveStreamUrl()/getArchiveUrl() produce.
 *
 * Why this exists: the timeshift_abs epoch-swap URL is what the backend
 * hands back from /api/channels/{id}/archive, and it's correct, but it's
 * also the ONLY shape getArchiveUrl()/buildArchiveStreamUrl() know how to
 * produce. This sibling helper gives callers a second, independent way to
 * point the player at a specific moment via the same date-path layout the
 * CDN already uses for preview thumbnails — useful for verifying playback
 * at a timestamp without trusting the epoch-swap path, or as a fallback if
 * the timeshift_abs URL isn't behaving as expected for a given stream.
 *
 * Like buildArchiveStreamUrl(), this is fully synchronous and zero network
 * cost — it just reuses the cached token from the most recent getArchiveUrl()
 * call for this channel. Returns null if that cache isn't warm yet; callers
 * should fall back to getArchiveUrl() in that case (e.g. on first load).
 */
export function buildArchiveStreamUrlByDatePath(
  channelId: string | undefined,
  timestamp: number
): string | null {
  if (!channelId) return null;
  const cached = archiveCache[channelId];
  if (!cached) return null;

  const parts = extractTokenAndBase(cached);
  if (!parts) return null;
  const { tokenQS, base } = parts;

  const { yyyy, mm, dd, hh, min, sec } = timestampToDatePathSegments(timestamp);

  return `${base}/${yyyy}/${mm}/${dd}/${hh}/${min}/${sec}.m3u8?${tokenQS}`;
}

/**
 * Synchronously swaps a new timestamp into the already-cached archive
 * stream URL (prefix + timestamp + suffix), reusing the same token.
 *
 * Zero network cost, no async round-trip — same pattern as getPreviewUrl().
 * Use this for fast scrubbing/dragging (e.g. live clip preview while the
 * user moves the trim selection) instead of calling getArchiveUrl() again,
 * which performs a cache-staleness check and can trigger a refetch.
 *
 * Returns null if the archive cache isn't warm yet for this channel —
 * caller should fall back to getArchiveUrl() in that case (e.g. on first load).
 */
export function buildArchiveStreamUrl(
  channelId: string | undefined,
  timestamp: number
): string | null {
  if (!channelId) return null;
  const cached = archiveCache[channelId];
  if (!cached) return null;
  return buildArchiveUrl(cached, timestamp);
}

/**
 * Builds a direct MP4 archive download URL from the cached token.
 * Format: {cdnBase}/archive-{startEpoch}-{durationSec}.mp4?{tokenQS}
 * Call getArchiveUrl() first to ensure the cache is warm.
 */
export function buildArchiveDownloadUrl(
  channelId: string,
  startTs:    number,
  durationSec: number
): string | null {
  const cached = archiveCache[channelId];
  if (!cached) return null;

  const tokenMatch = cached.suffix.match(/\?(.*)/);
  if (!tokenMatch) return null;
  const tokenQS = tokenMatch[1];

  const prefixMatch = cached.prefix.match(/^(https?:\/\/[^/]+\/tv\/[^/]+)\//);
  if (!prefixMatch) return null;
  const base = prefixMatch[1];

  return `${base}/archive-${startTs}-${durationSec}.mp4?${tokenQS}`;
}



// ── Add to streamService.ts ─────────────────────────────────────────────────
//
// getArchiveUrl() already does the real work of resolving a stream URL for
// an arbitrary timestamp — that part isn't new. What's missing is a way for
// a caller that fires one of these per UI tick (e.g. every settled drag
// position on a trim/scrub control) to do so WITHOUT having to manually
// track "is a previous call for this same logical session still in flight,
// and if so, throw its result away when a newer one starts."
//
// Without that, a caller has two bad options:
//   1. Don't fire a new request until the previous one resolves — visible
//      lag, and you can still race two callers calling this independently.
//   2. Fire on every tick and let whichever promise resolves LAST win —
//      that's a classic out-of-order race: if the request for an earlier
//      timestamp happens to resolve after the request for a later one
//      (slow network, retried request, anything), the UI ends up showing
//      the wrong moment, or — if the caller also tears down/destroys a
//      player instance per call — can leave the player attached to a
//      half-destroyed instance with no live request left to ever resolve
//      it. That's the open-ended "request races" version of the original
//      loadSource() bug, just one layer up at the fetch level instead of
//      the HLS-attach level.
//
// archiveUrlSequenced() fixes this with a simple monotonic ticket per
// channel: every call increments a counter and stamps its own ticket. When
// the request resolves, the result carries `current: boolean` — true only
// if no newer call for that channel has started since this one did. Callers
// drop the result if `current` is false instead of trying to coordinate
// AbortControllers or cancellation themselves.

type SequencedArchiveResult = ArchiveResult & {
  /**
   * False if a newer archiveUrlSequenced() call for the same channelId was
   * started before this one resolved — i.e. this result is stale and the
   * caller should ignore it rather than apply it to UI state.
   */
  current: boolean;
};

const archiveRequestTicket: Record<string, number> = {};

/**
 * Same as getArchiveUrl(), but safe to call once per UI tick (e.g. once per
 * settled drag position) without manually cancelling previous in-flight
 * calls. Each call for a given channelId gets a ticket; only the result
 * from the LATEST ticket for that channel comes back marked `current: true`
 * — every earlier in-flight call resolves with `current: false` once a
 * newer one has started, regardless of network ordering.
 *
 * Callers should check `.current` before acting on the result:
 *
 *   const r = await archiveUrlSequenced(channelId, ts);
 *   if (!r.current) return;   // a newer request has since superseded this one
 *   attachStream(r.url);
 */
export async function archiveUrlSequenced(
  channelId: string,
  timestamp: number
): Promise<SequencedArchiveResult> {
  const ticket = (archiveRequestTicket[channelId] ?? 0) + 1;
  archiveRequestTicket[channelId] = ticket;

  const result = await getArchiveUrl(channelId, timestamp);

  return {
    ...result,
    current: archiveRequestTicket[channelId] === ticket,
  };
}