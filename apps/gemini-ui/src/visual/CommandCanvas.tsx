import React, { Children, Fragment, isValidElement, useState, type ElementType, type ReactNode } from 'react';

type Region = 'hero' | 'status' | 'metrics' | 'overview' | 'inspector' | 'tools' | 'details';
type Props = { children: ReactNode; locale: 'en' | 'ar'; heroTypes?: ElementType[]; statusTypes?: ElementType[]; metricTypes?: ElementType[]; primaryTypes?: ElementType[]; toolTypes?: ElementType[] };

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child]);
}

/** Keeps existing domain components mounted, with bounded operating panels.
 * Component references (not function names) identify slots in production builds.
 */
export function CommandCanvas({ children, locale, heroTypes = [], statusTypes = [], metricTypes = [], primaryTypes = [], toolTypes = [] }: Props) {
  const [tab, setTab] = useState('overview');
  const regions: Record<Region, ReactNode[]> = { hero: [], status: [], metrics: [], overview: [], inspector: [], tools: [], details: [] };
  flatten(children).forEach(child => {
    if (!isValidElement<{ className?: string; 'data-testid'?: string }>(child)) return;
    const type = child.type as ElementType;
    const name = `${child.props.className || ''} ${child.props['data-testid'] || ''}`;
    const region: Region = heroTypes.includes(type) || /(?:^|\s)(?:sys-hero|knx-storage-hero)(?:\s|$)/.test(name) ? 'hero'
      : statusTypes.includes(type) || /native-banner|native-required|sys-banner|sys-scan-progress|border-amber-500\/35/.test(name) ? 'status'
      : metricTypes.includes(type) || /kpi-row|knx-storage-metrics/.test(name) ? 'metrics'
      : /knx-scan-status/.test(name) ? 'inspector'
      : toolTypes.includes(type) || /tools-panel|sys-services-panel/.test(name) ? 'tools'
      : primaryTypes.includes(type) || /apps-work-grid|cln-work-grid|stp-work-grid|scan-results-grid|knx-storage-analysis-grid|sys-main-grid|sys-overview-grid|sys-loading-grid|rep-workspace-grid|svc-main-grid|auto-editor-grid/.test(name) ? 'overview'
      : 'details';
    regions[region].push(child);
  });
  // Every supplied panel remains reachable, including native-only conditional
  // content. Hidden tabs stay mounted so selections and drafts survive.
  if (!regions.overview.length && regions.details.length) regions.overview.push(regions.details.shift());
  const tabs = [{ id: 'overview', label: locale === 'ar' ? 'مساحة العمل' : 'Workspace', nodes: regions.overview }, { id: 'tools', label: locale === 'ar' ? 'الأدوات والخدمات' : 'Tools & services', nodes: regions.tools }, { id: 'details', label: locale === 'ar' ? 'السجل والتفاصيل' : 'History & details', nodes: regions.details }].filter(item => item.nodes.length);
  const active = tabs.some(item => item.id === tab) ? tab : tabs[0]?.id;
  return <div className="knx-command-canvas">
    <div className="knx-command-hero">{regions.hero}</div>
    {regions.metrics.length > 0 && <div className="knx-command-metrics">{regions.metrics}</div>}
    {regions.status.length > 0 && <div className="knx-command-status" tabIndex={0}>{regions.status}</div>}
    <div className="knx-command-tabs" aria-label={locale === 'ar' ? 'لوحات القسم' : 'Workspace panels'}>
      {tabs.map(item => <button key={item.id} type="button" aria-pressed={active === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>
    <div className={`knx-command-body${regions.inspector.length ? ' has-inspector' : ''}`}>
      {tabs.map(item => <section key={item.id} hidden={active !== item.id} className={`knx-command-pane pane-${item.id}`} aria-label={item.label}>
        {item.nodes.map((node, index) => <div className="knx-command-panel" key={isValidElement(node) ? node.key ?? index : index}>{node}</div>)}
      </section>)}
      {regions.inspector.length > 0 && <aside className="knx-command-inspector">{regions.inspector}</aside>}
    </div>
  </div>;
}
