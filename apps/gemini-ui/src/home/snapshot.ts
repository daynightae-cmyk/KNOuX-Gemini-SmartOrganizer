import type {HomeLiveState} from './live';
/** Metadata describes original IPC envelopes, never the renderer refresh time. */
export interface HomeObservation {source:string;observedAt:string;stale:boolean;partial:boolean}
export type HomeObservations=Partial<Record<'system'|'services'|'sources'|'scans'|'apps'|'workflows'|'journal',HomeObservation>>;
export interface HomeSnapshot extends HomeLiveState {observations:HomeObservations}
