import type { FilesQueryRequest, NativeEnvelope, StudioQueryResult } from '../../shared/native-contracts';
import type { HomeLiveState } from './live';
import { queryFilesInventory } from '../files/native';
import { boundedHomeRead } from './native-read';

export type InventoryHit =
  | { kind: 'file'; key: string; label: string; sourceId: string; fileId: number; source: string }
  | { kind: 'app'; key: string; label: string; appId: string; source: string };
type Snapshot = Pick<HomeLiveState, 'sources' | 'apps' | 'observations'>;
type Query = (request: FilesQueryRequest) => Promise<NativeEnvelope<StudioQueryResult & {unsupported?: string}> | null>;

/** Search existing measured indexes only. Never authorize, index, open or execute. */
export async function searchHomeInventory(query: string, snapshot: Snapshot, read: Query = queryFilesInventory, timeoutMs = 6000) {
  if (typeof query !== 'string' || query.length > 200) throw Error('INVALID_SEARCH_QUERY');
  const q = query.trim();
  if (q.length < 2) return { hits: [] as InventoryHit[], warnings: [] as string[] };
  const hits: InventoryHit[] = [], warnings: string[] = [];
  const available = snapshot.sources.filter(s => ['ready', 'partial'].includes(s.status));
  const sources = [...new Map(available.map(s => [s.id, s])).values()].slice(0, 4);
  if (available.length > 4) warnings.push('SOURCE_LIMIT');
  if (!sources.length) warnings.push('NO_AUTHORIZED_INDEX');
  const results = await Promise.allSettled(sources.map(source => boundedHomeRead(`search:${source.id}:${q}`,
    () => read({ sourceId: source.id, search: q, offset: 0, limit: 6, sort: 'name', desc: false }), timeoutMs)));
  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === 'rejected') { warnings.push('INDEX_UNAVAILABLE'); return; }
    const e = result.value, d = e?.data;
    if (!e || e.contractVersion !== 1 || e.capability !== 'files.inventory.query' || e.error || e.permission === 'not-granted'
      || !['available', 'complete', 'partial'].includes(e.status) || ['fixture', 'unavailable'].includes(e.provenance?.mode || '')
      || !e.source || !Number.isFinite(Date.parse(e.observedAt)) || !d || d.sourceId !== source.id || d.offset !== 0 || d.limit !== 6
      || d.unsupported || !Array.isArray(d.rows) || d.rows.length > 6 || !Number.isSafeInteger(d.total) || d.total < d.rows.length) {
      warnings.push('INVALID_INDEX_RESPONSE'); return;
    }
    const ids = new Set<number>();
    if (d.rows.some(row => !Number.isSafeInteger(row.id) || row.id < 0 || ids.has(row.id) || (ids.add(row.id), false)
      || typeof row.name !== 'string' || !row.name || row.name.length > 255 || typeof row.relative !== 'string'
      || /^(?:[\\/]|[A-Za-z]:)/.test(row.relative) || row.relative.split(/[\\/]/).some(part => !part || part === '..' || part === '.'))) {
      warnings.push('INVALID_INDEX_ROWS'); return;
    }
    if (e.status === 'partial' || d.total > d.rows.length || source.status === 'partial') warnings.push('LIMITED_INDEX_RESULTS');
    if (Date.now() - Date.parse(e.observedAt) > 60000 || Date.parse(e.observedAt) > Date.now() + 5000) warnings.push('STALE_INDEX_OBSERVATION');
    hits.push(...d.rows.map(row => ({kind:'file' as const,key:`file:${source.id}:${row.id}`,label:row.name,sourceId:source.id,fileId:row.id,source:source.label})));
  });
  const observation = snapshot.observations?.apps;
  if (observation?.source && Number.isFinite(Date.parse(observation.observedAt)) && snapshot.apps) {
    const ids = new Set<string>();
    const apps = snapshot.apps.apps.filter(app => typeof app.id === 'string' && app.id.length > 0 && app.id.length <= 200 && !ids.has(app.id)
      && (ids.add(app.id), true) && typeof app.name === 'string' && app.name.length > 0 && app.name.length <= 255
      && `${app.name} ${app.publisher || ''}`.toLowerCase().includes(q.toLowerCase()));
    hits.push(...apps.slice(0, 12).map(app => ({kind:'app' as const,key:`app:${app.id}`,label:app.name,appId:app.id,source:observation.source})));
    if (observation.partial || observation.stale || apps.length > 12) warnings.push('LIMITED_APP_RESULTS');
  } else warnings.push('APP_INVENTORY_UNAVAILABLE');
  return { hits, warnings: [...new Set(warnings)] };
}

// Short-lived navigation intent, adapted from the preserved donor. It conveys
// identities only; the destination rechecks its own native inventory/permission.
let pending: { hit: InventoryHit; at: number } | null = null;
export function publishSearchIntent(hit: InventoryHit, at = Date.now()) {
  if (!hit || !['app', 'file'].includes(hit.kind) || typeof hit.label !== 'string' || !hit.label || hit.label.length > 255
    || typeof hit.key !== 'string' || !hit.key || hit.key.length > 500 || !Number.isFinite(at)
    || (hit.kind === 'file' && (typeof hit.sourceId !== 'string' || !hit.sourceId || hit.sourceId.length > 200 || !Number.isSafeInteger(hit.fileId) || hit.fileId < 0))
    || (hit.kind === 'app' && (typeof hit.appId !== 'string' || !hit.appId || hit.appId.length > 200))) throw Error('INVALID_SEARCH_INTENT');
  pending = { hit: {...hit}, at };
}
export function readSearchIntent(kind: InventoryHit['kind'], now = Date.now()) {
  return pending && pending.hit.kind === kind && now - pending.at <= 30000 && now >= pending.at - 5000 ? {...pending.hit} : null;
}
export function consumeSearchIntent(key: string) { if (pending?.hit.key === key) pending = null; }
