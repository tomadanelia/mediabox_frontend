/**
 * favoriteService.ts
 *
 * Singleton service that owns all favourite-channel fetching and mutation.
 *
 * API contract:
 *   GET  /api/user/preferences/favourite-channels
 *        → number[]   (array of external channel ids)
 *
 *   POST /api/user/preferences/favourite-channels
 *        body: { external_id: number }
 *        → 200 on success
 *
 *   DELETE /api/user/preferences/favourites/:channelId
 *        → 200 on success
 *
 * The service holds the favourites list in memory so any component can read it
 * synchronously after the initial fetch, and batches writes so rapid toggle
 * clicks never produce more than one in-flight request per channel.
 */

import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A subscriber is called every time the in-memory set changes. */
type Subscriber = (ids: ReadonlySet<number>) => void;

// ─── Module-level state ───────────────────────────────────────────────────────

/** Canonical set of favourite channel ids (external_id / ch.id as number). */
let favouriteIds: Set<number> = new Set();

/** Whether we have completed at least one successful GET. */
let initialised = false;

/** In-flight GET promise — prevents duplicate fetches on mount race. */
let fetchPromise: Promise<void> | null = null;

/** Subscribers notified on every mutation. */
const subscribers = new Set<Subscriber>();

/** Per-channel in-flight POST/DELETE promises for deduplication. */
const pendingWrites: Map<number, Promise<void>> = new Map();

// ─── Internal helpers ─────────────────────────────────────────────────────────

function notify(): void {
  const snapshot = new Set(favouriteIds) as ReadonlySet<number>;
  subscribers.forEach(fn => fn(snapshot));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load the favourites list from the server.
 * Safe to call multiple times — subsequent calls while a fetch is in-flight
 * return the same Promise and produce only one HTTP request.
 * Calls after initialisation return immediately.
 */
export async function fetchFavourites(): Promise<ReadonlySet<number>> {
  if (initialised) return favouriteIds;
  if (fetchPromise) return fetchPromise.then(() => favouriteIds);

  fetchPromise = api
    .get<number[]>('/api/user/preferences/favourite-channels')
    .then(res => {
      // Backend may return objects { id, ... } or raw numbers — handle both.
      const raw = Array.isArray(res.data) ? res.data : [];
      favouriteIds = new Set(
        raw.map((item: any) => (typeof item === 'number' ? item : Number(item.id ?? item.channel_id ?? item)))
      );
      initialised = true;
      notify();
    })
    .catch(err => {
      console.error('[favouriteService] fetchFavourites failed:', err);
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise.then(() => favouriteIds);
}

/**
 * Returns a snapshot of the current in-memory favourites.
 * Synchronous — returns whatever is cached (may be empty before first fetch).
 */
export function getFavourites(): ReadonlySet<number> {
  return favouriteIds;
}

/**
 * Returns true if the given channel id is currently a favourite.
 */
export function isFavourite(channelId: number): boolean {
  return favouriteIds.has(channelId);
}

/**
 * Mark a channel as favourite.
 * Optimistically updates the in-memory set, then persists to the backend.
 * If an identical write is already in-flight it is reused.
 */
export async function markFavourite(channelId: number): Promise<void> {
  if (favouriteIds.has(channelId)) return;

  // Optimistic update
  favouriteIds.add(channelId);
  notify();

  if (pendingWrites.has(channelId)) return pendingWrites.get(channelId)!;

  const req = api
    .post('/api/user/preferences/favourite-channels', { channelId: channelId })
    .catch(err => {
      console.error(`[favouriteService] markFavourite(${channelId}) failed:`, err);
      // Rollback optimistic update
      favouriteIds.delete(channelId);
      notify();
    })
    .finally(() => {
      pendingWrites.delete(channelId);
    }) as Promise<void>;

  pendingWrites.set(channelId, req);
  return req;
}

/**
 * Remove a channel from favourites.
 * Optimistically updates the in-memory set, then persists to the backend.
 */
export async function unmarkFavourite(channelId: number): Promise<void> {
  if (!favouriteIds.has(channelId)) return;

  // Optimistic update
  favouriteIds.delete(channelId);
  notify();

  if (pendingWrites.has(channelId)) return pendingWrites.get(channelId)!;

  const req = api
    .delete(`/api/user/preferences/favourites/${channelId}`)
    .catch(err => {
      console.error(`[favouriteService] unmarkFavourite(${channelId}) failed:`, err);
      // Rollback optimistic update
      favouriteIds.add(channelId);
      notify();
    })
    .finally(() => {
      pendingWrites.delete(channelId);
    }) as Promise<void>;

  pendingWrites.set(channelId, req);
  return req;
}

/**
 * Subscribe to changes in the favourites set.
 * Returns an unsubscribe function — call it in a useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *   return subscribeFavourites(ids => setFavIds(ids));
 * }, []);
 */
export function subscribeFavourites(fn: Subscriber): () => void {
  subscribers.add(fn);
  // Immediately call with current state so the subscriber is in sync.
  fn(new Set(favouriteIds) as ReadonlySet<number>);
  return () => subscribers.delete(fn);
}

/**
 * Evict in-memory state — call on logout.
 */
export function evictFavourites(): void {
  favouriteIds = new Set();
  initialised = false;
  fetchPromise = null;
  notify();
}