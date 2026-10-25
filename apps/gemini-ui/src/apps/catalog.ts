import type { DomainServiceKey } from '../lib/app-inventory';

export { DOMAIN_SERVICES_META } from '../lib/app-inventory';
export type { DomainServiceKey } from '../lib/app-inventory';

export const SERVICE_ACCENTS: Record<DomainServiceKey, string> = {
  'app-inventory': '#2476ff',
  'app-identity': '#06b6d4',
  'app-search': '#3b82f6',
  'app-publisher': '#a855f7',
  'app-recent': '#818cf8',
  'app-uninstall-queue': '#ef4444',
  'app-leftovers': '#f59e0b',
  'app-updates': '#26c6ff',
  'app-size': '#10b981',
  'app-store-packages': '#eab308',
  'app-associations': '#6366f1',
  'app-startup-impact': '#f97316',
};

export const SERVICE_ORDER: DomainServiceKey[] = [
  'app-inventory',
  'app-identity',
  'app-search',
  'app-publisher',
  'app-recent',
  'app-uninstall-queue',
  'app-leftovers',
  'app-updates',
  'app-size',
  'app-store-packages',
  'app-associations',
  'app-startup-impact',
];
