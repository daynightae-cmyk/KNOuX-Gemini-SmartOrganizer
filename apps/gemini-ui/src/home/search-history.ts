/**
 * KNOuX — Home search history (service mission-01-09, persistence layer).
 *
 * Global Search previously forgot everything the moment the palette closed, so
 * the service had no persistence layer at all. This adds one that is deliberately
 * small and honest:
 *
 *  - bounded: at most eight entries, newest first, duplicates collapse;
 *  - local only: `localStorage` under a versioned key. Nothing is sent anywhere,
 *    and nothing is written to the owner's filesystem;
 *  - validated on read as well as on write, because storage is user-editable and
 *    a corrupt blob must degrade to "no history" rather than crash Home or, worse,
 *    render an arbitrary string as if it were a past search;
 *  - clearable in one action, and the clear is real (the key is removed, not
 *    hidden).
 *
 * Queries are capped and stripped of control characters. A pasted absolute path
 * is kept as plain text — it is the user's own query — but it can never become a
 * command, because nothing here executes it.
 */

export const SEARCH_HISTORY_KEY = 'knoux.home.search.history.v1';
export const SEARCH_HISTORY_LIMIT = 8;
const MAX_QUERY_LENGTH = 200;

export type SearchHistoryEntry = { query: string; at: string };

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStore(): Store | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

const sanitize = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH);
  return cleaned.length >= 2 ? cleaned : null;
};

const validEntry = (value: unknown): value is SearchHistoryEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.query === 'string' && sanitize(entry.query) === entry.query
    && typeof entry.at === 'string' && Number.isFinite(Date.parse(entry.at));
};

/** Read persisted history. Any structural problem degrades to empty, never throws. */
export function readSearchHistory(source: Store | null = defaultStore()): SearchHistoryEntry[] {
  if (!source) return [];
  let raw: string | null = null;
  try { raw = source.getItem(SEARCH_HISTORY_KEY); } catch { return []; }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.filter((entry) => validEntry(entry) && !seen.has((entry as SearchHistoryEntry).query.toLowerCase())
      && (seen.add((entry as SearchHistoryEntry).query.toLowerCase()), true)).slice(0, SEARCH_HISTORY_LIMIT);
  } catch { return []; }
}

/**
 * Record one successful query. Only queries that actually ran are recorded, and
 * only when they produced something to act on — a search that hit no authorized
 * index is not a useful "recent search" to show back.
 */
export function pushSearchHistory(query: string, source: Store | null = defaultStore(), at = new Date().toISOString()): SearchHistoryEntry[] {
  const cleaned = sanitize(query);
  if (!cleaned || !source) return readSearchHistory(source);
  const next: SearchHistoryEntry[] = [{ query: cleaned, at }, ...readSearchHistory(source)
    .filter((entry) => entry.query.toLowerCase() !== cleaned.toLowerCase())].slice(0, SEARCH_HISTORY_LIMIT);
  try { source.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* storage full or blocked: history is optional, the search is not */ }
  return next;
}

export function clearSearchHistory(source: Store | null = defaultStore()): void {
  if (!source) return;
  try { source.removeItem(SEARCH_HISTORY_KEY); } catch { /* ignore: nothing is claimed to have been erased */ }
}
