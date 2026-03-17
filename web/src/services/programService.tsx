/**
 * programService.ts
 *
 * Singleton service that owns all program guide fetching and caching.
 * Cache is keyed by "channelId::date" (e.g. "22::2026/03/07").
 *
 * Programs for a past or current day never change after the day ends,
 * so we cache them indefinitely for the session.
 * Programs for today are cached for 10 minutes (schedule may update live).
 * Programs for a future date are cached for 30 minutes.
 */

import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgramItem = {
  UID: number;
  CHANNEL_ID: number;
  START_TIME: number;
  END_TIME: number;
  TITLE: string;
  GANRE: string;
  DESCRIPTION: string;
};

type CacheEntry = {
  programs: ProgramItem[];
  /** Unix seconds at which this entry is considered stale. null = never stale. */
  staleAt: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY_TTL_SEC    = 10 * 60;  // 10 min — today's schedule can change
const FUTURE_TTL_SEC   = 30 * 60;  // 30 min — future schedule changes rarely
// Past days: staleAt = null (cached forever for the session)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function cacheKey(channelId: string, date: string): string {
  return `${channelId}::${date}`;
}

/**
 * Returns "2026/03/07" for today in local time — same format the API expects.
 */
function todayApiDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * Compare two API date strings (YYYY/MM/DD).
 * Returns -1 / 0 / 1.
 */
function compareDates(a: string, b: string): number {
  // YYYY/MM/DD lexicographic compare works fine
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function staleAtForDate(date: string): number | null {
  const today = todayApiDate();
  const rel = compareDates(date, today);
  if (rel < 0) return null;                         // past — never expires
  if (rel === 0) return nowSec() + TODAY_TTL_SEC;   // today — 10 min
  return nowSec() + FUTURE_TTL_SEC;                 // future — 30 min
}

function isCacheValid(entry: CacheEntry): boolean {
  if (entry.staleAt === null) return true;          // past day, always valid
  return nowSec() < entry.staleAt;
}

// ─── Cache store ──────────────────────────────────────────────────────────────

const programCache: Record<string, CacheEntry> = {};

/**
 * In-flight request deduplication map.
 *
 * If two callers ask for the same key before the first request resolves
 * (e.g. StrictMode double-invoke, or two effects firing simultaneously),
 * they both receive the exact same Promise — only one HTTP request is made.
 * The entry is deleted as soon as the request settles.
 */
const inFlight: Record<string, Promise<ProgramItem[]> | undefined> = {};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch programs for a single channel + date.
 * Returns from cache if still fresh, otherwise fetches from backend and stores.
 */
export async function getPrograms(
  channelId: string,
  date: string
): Promise<ProgramItem[]> {
  const key = cacheKey(channelId, date);
  const cached = programCache[key];

  if (cached && isCacheValid(cached)) {
    console.log(`🟢 [programService] HIT  ch=${channelId}  date=${date}  items=${cached.programs.length}`);
    return cached.programs;
  }

  // If a fetch for this exact key is already in-flight, reuse it — no double request
  if (inFlight[key]) {
    console.log(`🔵 [programService] DEDUP ch=${channelId}  date=${date} — reusing in-flight request`);
    return inFlight[key];
  }

  console.log(`🔴 [programService] MISS ch=${channelId}  date=${date} — fetching from backend`);

  const request = api
    .get(`/api/channels/${channelId}/programs`, { params: { date } })
    .then(res => {
      const programs: ProgramItem[] = res.data ?? [];
      programCache[key] = { programs, staleAt: staleAtForDate(date) };
      console.log(`🟡 [programService] STORED ch=${channelId}  date=${date}  items=${programs.length}  staleAt=${programCache[key].staleAt ?? 'never'}`);
      return programs;
    })
    .finally(() => {
      delete inFlight[key];
    });

  inFlight[key] = request;
  return request;
}

/**
 * Fetch programs for today AND tomorrow in parallel.
 * This is the primary call used by the Stream page to feed the timeline
 * (today's first show → tomorrow's first show).
 *
 * Returns { programs, nextDayPrograms } matching the existing state shape.
 */
export async function getProgramsForTimeline(
  channelId: string,
  date: string          // the "current" date the user is viewing
): Promise<{ programs: ProgramItem[]; nextDayPrograms: ProgramItem[] }> {
  const nextDate = addOneDay(date);

  const [programs, nextDayPrograms] = await Promise.all([
    getPrograms(channelId, date).catch(e => {
      console.error(`[programService] failed to fetch programs ch=${channelId} date=${date}`, e);
      return [] as ProgramItem[];
    }),
    getPrograms(channelId, nextDate).catch(e => {
      console.error(`[programService] failed to fetch nextDay programs ch=${channelId} date=${nextDate}`, e);
      return [] as ProgramItem[];
    }),
  ]);

  return { programs, nextDayPrograms };
}

/**
 * Pre-warm the cache for a channel + date pair without blocking the caller.
 * Safe to call speculatively (e.g. when the user hovers a date in the calendar).
 */
export function prefetchPrograms(channelId: string, date: string): void {
  const key = cacheKey(channelId, date);
  const cached = programCache[key];
  if (cached && isCacheValid(cached)) return; // already warm
  getPrograms(channelId, date).catch(() => {}); // fire and forget
}

/**
 * Evict cached programs for a specific channel + date.
 */
export function evictPrograms(channelId: string, date: string): void {
  delete programCache[cacheKey(channelId, date)];
}

/**
 * Evict all cached programs for a channel (all dates).
 */
export function evictChannelPrograms(channelId: string): void {
  const prefix = `${channelId}::`;
  Object.keys(programCache)
    .filter(k => k.startsWith(prefix))
    .forEach(k => delete programCache[k]);
}

/**
 * Evict everything. Useful on logout.
 */
export function evictAllPrograms(): void {
  Object.keys(programCache).forEach(k => delete programCache[k]);
}

// ─── Internal helper (mirrors the one in Stream.tsx) ─────────────────────────

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr.replace(/\//g, '-'));
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}