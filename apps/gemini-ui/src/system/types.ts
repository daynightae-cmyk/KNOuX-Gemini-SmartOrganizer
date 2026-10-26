import type { SystemMetrics, SystemSnapshot } from '../../shared/native-contracts';
import type { SystemLocale, SystemServiceState } from './catalog';
import type { SystemController } from './useSystem';

export interface WorkbenchProps {
  locale: SystemLocale;
  snapshot: SystemSnapshot;
  series: SystemMetrics[];
  controller: SystemController;
  onOpenService: (id: string) => void;
}

export interface ServiceStateView {
  state: SystemServiceState;
  provider: string | null;
}
