/**
 * KNOuX Home live data.
 *
 * Home never invents a number: every value either comes from an existing
 * read-only bridge or is rendered as "not measured" with the owning service
 * link. Heavy scans are not started automatically from Home.
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  AppsInventory,
  AutomationJournalEntry,
  AutomationWorkflow,
  ScanSummary,
  ServicesSummaryData,
  StudioQueryFile,
  StudioSource,
  SystemSummaryData,
} from '../../shared/native-contracts';
import { readServicesSummary, readSystemSummary } from '../native/client';
import { listFilesSources, queryFilesInventory } from '../files/native';
import { loadAppsInventory } from '../apps/native';
import { loadScanHistory } from '../scan/native';
import { loadAutomationJournal, loadAutomationWorkflows } from '../automation/native';

export type HomeLiveStatus = 'loading' | 'live' | 'partial' | 'native-required';

export interface HomeLiveState {
  status: HomeLiveStatus;
  system: SystemSummaryData | null;
  services: ServicesSummaryData | null;
  sources: StudioSource[];
  files: StudioQueryFile[];
  scans: ScanSummary[];
  workflows: AutomationWorkflow[];
  journal: AutomationJournalEntry[];
  apps: AppsInventory | null;
  errors: string[];
  observedAt: string | null;
}

const EMPTY: HomeLiveState = {
  status: 'loading',
  system: null,
  services: null,
  sources: [],
  files: [],
  scans: [],
  workflows: [],
  journal: [],
  apps: null,
  errors: [],
  observedAt: null,
};

function errorText(error: unknown): string {
  return String((error as { message?: string })?.message || error).replace(/\s+/g, ' ').slice(0, 180);
}

export function useHomeLive() {
  const [state, setState] = useState<HomeLiveState>(EMPTY);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', errors: [] }));
    const errors: string[] = [];
    let native = false;

    const [systemResult, servicesResult, sourcesResult, scansResult, appsResult, workflowsResult, journalResult] = await Promise.allSettled([
      readSystemSummary(),
      readServicesSummary(),
      listFilesSources(),
      loadScanHistory(),
      loadAppsInventory(),
      loadAutomationWorkflows(),
      loadAutomationJournal(),
    ]);

    const system = systemResult.status === 'fulfilled' ? systemResult.value?.data ?? null : null;
    const services = servicesResult.status === 'fulfilled' ? servicesResult.value?.data ?? null : null;
    const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value?.data ?? [] : [];
    const scans = scansResult.status === 'fulfilled' ? scansResult.value?.data ?? [] : [];
    const apps = appsResult.status === 'fulfilled' ? appsResult.value?.data ?? null : null;
    const workflows = workflowsResult.status === 'fulfilled' ? workflowsResult.value?.data ?? [] : [];
    const journal = journalResult.status === 'fulfilled' ? journalResult.value?.data ?? [] : [];

    if (system || services || (sourcesResult.status === 'fulfilled' && sourcesResult.value) || (scansResult.status === 'fulfilled' && scansResult.value) || (appsResult.status === 'fulfilled' && appsResult.value) || (workflowsResult.status === 'fulfilled' && workflowsResult.value) || (journalResult.status === 'fulfilled' && journalResult.value)) native = true;
    for (const [label, result] of [
      ['system summary', systemResult],
      ['services summary', servicesResult],
      ['files sources', sourcesResult],
      ['scan history', scansResult],
      ['applications inventory', appsResult],
      ['automation workflows', workflowsResult],
      ['automation journal', journalResult],
    ] as const) {
      if (result.status === 'rejected') errors.push(`${label}: ${errorText(result.reason)}`);
    }

    let files: StudioQueryFile[] = [];
    const source = sources.find((entry) => entry.status === 'ready') || sources[0] || null;
    if (source) {
      try {
        const query = await queryFilesInventory({ sourceId: source.id, limit: 6, sort: 'modified', desc: true });
        files = query?.data?.rows ?? [];
        if (query?.data?.unsupported) errors.push(`recent files: ${query.data.unsupported}`);
      } catch (error) {
        errors.push(`recent files: ${errorText(error)}`);
      }
    }

    const observedAt = new Date().toISOString();
    const hasMeasuredCore = Boolean(system || services || source || scans.length || apps || workflows.length || journal.length);
    const status: HomeLiveStatus = !native || !hasMeasuredCore
      ? 'native-required'
      : (errors.length ? 'partial' : 'live');

    setState({
      status,
      system,
      services,
      sources,
      files,
      scans,
      workflows,
      journal,
      apps,
      errors: [...new Set(errors)],
      observedAt,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
