/**
 * KNOuX Home live data.
 *
 * Home never invents a number: every value either comes from an existing
 * read-only bridge or is rendered as "not measured" with the owning service
 * link. Heavy scans are not started automatically from Home.
 */
import type {HomeObservations} from './snapshot';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import type {OperationReceipt} from '../../shared/operation-contract';
import {measuredProviderData} from './provider-result';
import {boundedHomeRead} from './native-read';
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
  receipts: OperationReceipt[];
  available: {workflows:boolean;journal:boolean};
  errors: string[];
  observedAt: string | null;
  observations?: HomeObservations;
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
  receipts: [],
  available: {workflows:false,journal:false},
  errors: [],
  observedAt: null,
};

function errorText(error: unknown): string {
  return String((error as { message?: string })?.message || error).replace(/\s+/g, ' ').slice(0, 180);
}

export function useHomeLive() {
  const [state, setState] = useState<HomeLiveState>(EMPTY);
  const epoch=useRef(0);

  const refresh = useCallback(async () => {
    const request=++epoch.current;
    setState((current) => ({ ...current, status: 'loading', errors: [] }));
    const errors: string[] = [];

    const [systemResult, servicesResult, sourcesResult, scansResult, appsResult, workflowsResult, journalResult, receiptResult] = await Promise.allSettled([
      boundedHomeRead('system summary',readSystemSummary),
      boundedHomeRead('services summary',readServicesSummary),
      boundedHomeRead('files sources',listFilesSources),
      boundedHomeRead('scan history',loadScanHistory),
      boundedHomeRead('applications inventory',loadAppsInventory),
      boundedHomeRead('automation workflows',loadAutomationWorkflows),
      boundedHomeRead('automation journal',loadAutomationJournal),
      boundedHomeRead('organization receipts',()=>window.knouxOperationsV1?.history()||Promise.resolve(null)),
    ]);

    const system=measuredProviderData(systemResult,'system summary',errors);
    const services=measuredProviderData(servicesResult,'services summary',errors);
    const sourceData=measuredProviderData(sourcesResult,'files sources',errors);
    const scanData=measuredProviderData(scansResult,'scan history',errors);
    const apps=measuredProviderData(appsResult,'applications inventory',errors);
    const workflowData=measuredProviderData(workflowsResult,'automation workflows',errors);
    const journalData=measuredProviderData(journalResult,'automation journal',errors);
    const receipts=measuredProviderData(receiptResult,'organization receipts',errors)||[];
    const sources=sourceData||[],scans=scanData||[],workflows=workflowData||[],journal=journalData||[];

    let files: StudioQueryFile[] = [];
    const source = sources.find((entry) => entry.status === 'ready') || sources[0] || null;
    if (source) {
      try {
        const query = await boundedHomeRead('recent files '+source.id,()=>queryFilesInventory({ sourceId: source.id, limit: 6, sort: 'modified', desc: true }));
        files = measuredProviderData({status:'fulfilled',value:query},'recent files',errors)?.rows ?? [];
        if (query?.data?.unsupported) errors.push(`recent files: ${query.data.unsupported}`);
      } catch (error) {
        errors.push(`recent files: ${errorText(error)}`);
      }
    }

    const observations:HomeObservations={};
    const results=[systemResult,servicesResult,sourcesResult,scansResult,appsResult,workflowsResult,journalResult];
    const data=[system,services,sourceData,scanData,apps,workflowData,journalData];
    const domains=['system','services','sources','scans','apps','workflows','journal'] as const;
    domains.forEach((domain,index)=>{
      const result=results[index];
      if(data[index]==null||result.status!=='fulfilled'||!result.value)return;
      const envelope=result.value,at=Date.parse(envelope.observedAt);
      if(!Number.isFinite(at))return;
      const stale=Date.now()-at>60000||at-Date.now()>5000;
      observations[domain]={source:envelope.source,observedAt:envelope.observedAt,stale,partial:envelope.status==='partial'};
      if(stale)errors.push(domain+': stale provider observation');
    });
    const observedAt=Object.values(observations).map(o=>o.observedAt).sort()[0]??null;
    const hasMeasuredCore = Boolean(system || services || sourceData || scanData || apps || workflowData || journalData);
    const status: HomeLiveStatus = !hasMeasuredCore
      ? 'native-required'
      : (errors.length ? 'partial' : 'live');

    if(request!==epoch.current)return;
    setState({
      status,
      system,
      services,
      sources,
      files,
      scans,
      workflows,
      journal,
      receipts,
      available:{workflows:workflowData!==null,journal:journalData!==null},
      apps,
      errors: [...new Set(errors)],
      observedAt,
      observations,
    });
  }, []);

  useEffect(() => {
    void refresh();
    const updated=()=>void refresh();window.addEventListener('knoux:organization-updated',updated);
    return()=>{epoch.current++;window.removeEventListener('knoux:organization-updated',updated);};
  }, [refresh]);

  return { ...state, refresh };
}
