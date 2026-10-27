import React, { Children, Fragment, cloneElement, isValidElement, useState, type ElementType, type ReactNode } from 'react';
import { useNavigation } from '../context/NavigationContext';

type Region = 'hero' | 'status' | 'metrics' | 'overview' | 'inspector' | 'tools' | 'details';
type ToolPlacement = 'dock' | 'rail';
type Props = { children: ReactNode; locale: 'en' | 'ar'; heroTypes?: ElementType[]; statusTypes?: ElementType[]; metricTypes?: ElementType[]; primaryTypes?: ElementType[]; toolTypes?: ElementType[]; toolPlacement?: ToolPlacement };

function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child]);
}

/** Keeps existing domain components mounted, with bounded operating panels.
 * Component references (not function names) identify slots in production builds.
 */
export function CommandCanvas({ children, locale, heroTypes = [], statusTypes = [], metricTypes = [], primaryTypes = [], toolTypes = [], toolPlacement = 'dock' }: Props) {
  const { currentSection } = useNavigation();
  const [tab, setTab] = useState('overview');
  const regions: Record<Region, ReactNode[]> = { hero: [], status: [], metrics: [], overview: [], inspector: [], tools: [], details: [] };
  flatten(children).forEach(child => {
    if (!isValidElement<{ className?: string; children?: ReactNode; 'data-testid'?: string }>(child)) return;
    const type = child.type as ElementType;
    const name = `${child.props.className || ''} ${child.props['data-testid'] || ''}`;
    const region: Region = heroTypes.includes(type) || /(?:^|\s)(?:sys-hero|knx-storage-hero)(?:\s|$)/.test(name) ? 'hero'
      : statusTypes.includes(type) || /native-banner|native-required|sys-banner|sys-scan-progress|border-amber-500\/35/.test(name) ? 'status'
      : metricTypes.includes(type) || /kpi-row|knx-storage-metrics/.test(name) ? 'metrics'
      : /knx-scan-status|svc-graph-panel/.test(name) ? 'inspector'
      : toolTypes.includes(type) || /tools-panel|sys-services-panel/.test(name) ? 'tools'
      : primaryTypes.includes(type) || /apps-work-grid|cln-work-grid|stp-work-grid|scan-results-grid|knx-storage-analysis-grid|knx-storage-volumes|sys-main-grid|sys-overview-grid|sys-loading-grid|rep-workspace-grid|svc-main-grid|auto-editor-grid/.test(name) ? 'overview'
      : 'details';
    if (region === 'hero' && /sys-hero/.test(name) && currentSection !== 'automation') {
      const items = flatten(child.props.children);
      const source = items.filter(item => isValidElement<{className?: string}>(item) && /sys-source-card/.test(item.props.className || ''));
      regions.inspector.push(...source);
      regions.hero.push(cloneElement(child, {}, items.filter(item => !source.includes(item))));
    } else if (region === 'overview' && /apps-work-grid|cln-work-grid|stp-work-grid|scan-results-grid|knx-storage-analysis-grid|rep-workspace-grid|svc-main-grid/.test(name)) {
      const panels = flatten(child.props.children);
      regions.overview.push(panels[0]);
      regions.inspector.push(...panels.slice(1));
    } else if (region === 'overview' && /sys-loading-grid/.test(name)) {
      const panels = flatten(child.props.children);
      regions.inspector.push(panels[0]);
      regions.overview.push(<div className="knx-system-awaiting" key="system-awaiting"><div className="knx-native-chart-placeholder"><span>{locale === 'ar' ? 'مخطط الأداء — بانتظار عينات أصلية مقيسة' : 'Performance timeline — awaiting measured native samples'}</span></div></div>);
      regions.tools.push(...panels.slice(1));
    } else {
      regions[region].push(child);
    }
  });
  // Every supplied panel remains reachable, including native-only conditional
  // content. Hidden tabs stay mounted so selections and drafts survive.
  if (!regions.overview.length && regions.details.length) regions.overview.push(regions.details.shift());
  const tabs = [{ id: 'overview', label: locale === 'ar' ? 'مساحة العمل' : 'Workspace', nodes: regions.overview }, { id: 'details', label: locale === 'ar' ? 'السجل والتفاصيل' : 'History & details', nodes: regions.details }].filter(item => item.nodes.length);
  const active = tabs.some(item => item.id === tab) ? tab : tabs[0]?.id;
  // Rail placement keeps the reference's main ledger/chart at full height while
  // the domain tools remain one visible, readable step away.
  const railTools = toolPlacement === 'rail' && regions.tools.length > 0;
  const dockTools = !railTools && regions.tools.length > 0;
  const hasInspector = regions.inspector.length > 0 || railTools;
  return <div className={`knx-command-canvas${hasInspector ? ' has-reference-inspector' : ''}`}>
    <div className="knx-command-hero">{regions.hero}</div>
    {regions.metrics.length > 0 && <div className="knx-command-metrics">{regions.metrics}</div>}
    {regions.status.length > 0 && <div className="knx-command-status" tabIndex={0}>{regions.status}</div>}
    {tabs.length > 1 && <div className="knx-command-tabs" aria-label={locale === 'ar' ? 'لوحات القسم' : 'Workspace panels'}>
      {tabs.map(item => <button key={item.id} type="button" aria-pressed={active === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>}
    <div className={`knx-command-body${dockTools ? ' has-tool-dock' : ''}`}>
      {tabs.map(item => <section key={item.id} hidden={active !== item.id} className={`knx-command-pane pane-${item.id}`} aria-label={item.label}>
        {item.nodes.map((node, index) => <div className="knx-command-panel" key={isValidElement(node) ? node.key ?? index : index}>{node}</div>)}
      </section>)}
      {dockTools && <section className="knx-command-tool-dock" aria-label={locale === 'ar' ? 'الأدوات الرئيسية' : 'Primary tools'}>{regions.tools}</section>}
    </div>
    {hasInspector && <aside className={`knx-command-inspector${railTools ? ' has-tool-rail' : ''}`}>
      {regions.inspector}
      {railTools && <section className="knx-command-tool-rail" aria-label={locale === 'ar' ? 'الأدوات الرئيسية' : 'Primary tools'}>{regions.tools}</section>}
    </aside>}
  </div>;
}
