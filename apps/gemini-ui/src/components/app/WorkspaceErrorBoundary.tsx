import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

/**
 * Last-resort containment for one workspace. A renderer fault inside a domain
 * must never blank the whole shell, lose the navigation rail, or look like the
 * app crashed: the fallback states plainly that nothing was changed and offers
 * a local retry plus a safe return home. Errors are logged to the console only;
 * no message, path or stack is written to disk or sent anywhere.
 */
interface Props {
  children: ReactNode;
  locale: 'en' | 'ar';
  section: string;
  onHome: () => void;
}

interface State {
  failed: boolean;
  attempt: number;
}

export class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[KNOuX] workspace render fault', this.props.section, error, info.componentStack?.slice(0, 1200));
  }

  componentDidUpdate(previous: Props) {
    // Navigation is a user escape hatch: a fault in one domain must not freeze
    // the boundary for the next one the person opens.
    if (previous.section !== this.props.section && this.state.failed) {
      this.setState((old) => ({ failed: false, attempt: old.attempt + 1 }));
    }
  }

  private retry = () => {
    this.setState((old) => ({ failed: false, attempt: old.attempt + 1 }));
  };

  render() {
    if (!this.state.failed) {
      return (
        <div className="knx-workspace-boundary" data-workspace-state="ready">
          <div className="knx-workspace-attempt" key={this.state.attempt} data-workspace-attempt={this.state.attempt}>
            {this.props.children}
          </div>
        </div>
      );
    }
    const ar = this.props.locale === 'ar';
    return (
      <div className="knx-workspace-boundary" data-workspace-state="fault">
        <section className="knx-workspace-fault" role="alert" data-testid="workspace-render-fault">
          <span className="knx-workspace-fault__glyph" aria-hidden="true"><AlertTriangle /></span>
          <div>
            <p className="knx-workspace-fault__eyebrow">KNOuX · {ar ? 'حدّ خطأ معزول' : 'Isolated fault boundary'}</p>
            <h2>{ar ? 'توقّف عرض مساحة العمل' : 'This workspace stopped rendering'}</h2>
            <p>
              {ar
                ? 'لم يتم تغيير أي ملف أو إعداد. أعد المحاولة، أو ارجع للرئيسية ثم افتح القسم مرة أخرى.'
                : 'No file, setting or service was changed. Retry the workspace, or return home and open the section again.'}
            </p>
            <div className="knx-workspace-fault__actions">
              <button type="button" onClick={this.retry} data-testid="workspace-render-retry">
                <RotateCcw aria-hidden="true" />{ar ? 'إعادة المحاولة' : 'Retry workspace'}
              </button>
              <button type="button" className="is-quiet" onClick={this.props.onHome}>
                <Home aria-hidden="true" />{ar ? 'العودة للرئيسية' : 'Return home'}
              </button>
            </div>
            <small>{ar ? 'التفاصيل التقنية في سجل التطوير فقط.' : 'Technical detail stays in the developer console only.'}</small>
          </div>
        </section>
      </div>
    );
  }
}

export default WorkspaceErrorBoundary;
