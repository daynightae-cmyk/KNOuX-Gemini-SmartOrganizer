import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { ArrowRight, Check, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { getNativeShell, readBridgeStatus } from '../../native/client';
import { EntryAudio } from './audio';
import { ENTRY_MS, FORMATION_MS, loadPreferences, savePreferences, transition, type EntryEvent, type EntryPhase } from './model';
import { startParticles } from './particles';
import './entry.css';

function focusWorkspaceTarget(target: HTMLElement | null | undefined) {
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

function useEntryController() {
  const { currentSection, theme } = useNavigation();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemReduced, setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced = preferences.reduced || systemReduced;
  const [phase, setPhase] = useState<EntryPhase>(() => {
    const replay = new URLSearchParams(location.search).get('cinematic') === 'replay';
    return preferences.seen && !preferences.always && !replay ? 'ACTIVE' : 'INIT';
  });
  const phaseRef = useRef(phase);
  const [painted, setPainted] = useState(false);
  const [native, setNative] = useState<'preview' | 'pending' | 'ready' | 'unavailable'>(() => getNativeShell() ? 'pending' : 'preview');
  const [audioState, setAudioState] = useState<'idle' | 'played' | 'blocked'>('idle');
  const [saved, setSaved] = useState(true);
  const overlay = useRef<HTMLDialogElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<EntryAudio | null>(null);
  const disposed = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const state = useRef({ phase, reduced, home: currentSection === 'home', light: theme === 'light' });
  state.current = { phase, reduced, home: currentSection === 'home', light: theme === 'light' };
  const send = (event: EntryEvent) => {
    const next = transition(phaseRef.current, event);
    phaseRef.current = next; setPhase(next);
  };
  const persist = (patch: Partial<typeof preferences>) => {
    setPreferences(prev => { const next = { ...prev, ...patch }; setSaved(savePreferences(next)); return next; });
  };
  const play = (cue: 'unlock' | 'enter') => {
    audio.current ??= new EntryAudio();
    void audio.current.gesture(cue).then(ok => { if (!disposed.current) setAudioState(ok ? 'played' : 'blocked'); });
  };
  const enter = (skip = false) => {
    if (!painted || phaseRef.current === 'ENTERING' || phaseRef.current === 'ACTIVE') return;
    if (skip) send('READY');
    if (phaseRef.current !== 'READY') return;
    // Guard synchronously, before any async audio continuation or second click.
    send('ENTER');
    if (!preferences.muted && !skip) play('enter');
  };
  useEffect(() => {
    disposed.current = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setSystemReduced(media.matches);
    media.addEventListener('change', changed);
    const hidden = () => { if (document.hidden) audio.current?.dispose(); };
    document.addEventListener('visibilitychange', hidden);
    const replay = () => {
      if (phaseRef.current !== 'ACTIVE') return;
      returnFocus.current = document.activeElement as HTMLElement;
      send('REPLAY'); setAudioState('idle');
    };
    window.addEventListener('knoux:replay-entry', replay);
    return () => { disposed.current = true; audio.current?.dispose(); media.removeEventListener('change', changed); document.removeEventListener('visibilitychange', hidden); window.removeEventListener('knoux:replay-entry', replay); };
  }, []);
  useEffect(() => {
    let first = 0, second = 0;
    first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setPainted(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, []);
  useEffect(() => {
    if (!getNativeShell()) return;
    let live = true;
    const timeout = setTimeout(() => { if (live) setNative('unavailable'); }, 4500);
    void readBridgeStatus().then(result => {
      if (live) { clearTimeout(timeout); setNative(result?.data?.bridge === 'ready' ? 'ready' : 'unavailable'); }
    }).catch(() => { if (live) { clearTimeout(timeout); setNative('unavailable'); } });
    return () => { live = false; clearTimeout(timeout); };
  }, []);
  useEffect(() => canvas.current ? startParticles(canvas.current, () => state.current) : undefined, []);
  useEffect(() => {
    if (phase === 'INIT') { overlay.current?.focus(); send('FORM'); }
    if (phase === 'FORMING' && painted) {
      const timer = setTimeout(() => send('READY'), reduced ? 0 : FORMATION_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, painted, reduced]);
  useEffect(() => {
    if (phase === 'ENTERING') {
      const timer = setTimeout(() => {
        persist({ seen: true }); send('FINISH'); audio.current?.dispose();
      }, reduced ? 180 : ENTRY_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, reduced]);
  useEffect(() => {
    if (phase === 'ACTIVE' && painted) {
      const target = returnFocus.current?.isConnected ? returnFocus.current : workspace.current?.querySelector<HTMLElement>('main h1, main h2, main');
      focusWorkspaceTarget(target);
    }
  }, [phase, painted, reduced]);

  return { preferences, reduced, phase, phaseRef, painted, native, audioState, saved, overlay, workspace, canvas, persist, play, enter, audio, setAudioState, setPhase, systemReduced };
}

type Controller = ReturnType<typeof useEntryController>;
type ViewProps = Readonly<{ c: Controller; ar: boolean }>;
const translate = (ar: boolean, en: string, arabic: string) => ar ? arabic : en;

function nativeNote(native: Controller['native'], ar: boolean) {
  const notes = {
    preview: ['Browser preview · Windows bridge unavailable', 'معاينة المتصفح · جسر Windows غير متاح'],
    pending: ['Connecting to Windows bridge…', 'جارٍ الاتصال بجسر Windows…'],
    ready: ['App bridge connected · permissions still apply', 'جسر التطبيق متصل · تبقى الأذونات مطلوبة'],
    unavailable: ['Native bridge unavailable · check service status in workspace', 'الجسر الأصلي غير متاح · راجع حالة الخدمات داخل التطبيق'],
  };
  return notes[native][Number(ar)];
}

function handleEntryKeys(event: KeyboardEvent<HTMLDialogElement>, c: Controller) {
  if (event.key === 'Escape') { event.preventDefault(); c.enter(true); }
  if (event.key !== 'Tab') return;
  const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
  const index = nodes.indexOf(document.activeElement as HTMLElement);
  const atStart = event.shiftKey && index <= 0;
  const atEnd = !event.shiftKey && (index === nodes.length - 1 || index === -1);
  if (!atStart && !atEnd) return;
  event.preventDefault();
  const target = atStart ? nodes.at(-1) : nodes[0];
  target?.focus();
}

function EntryControls({ c, ar }: ViewProps) {
  const mutedLabel = translate(ar, 'Enable sound', 'تشغيل الصوت');
  const enabledLabel = translate(ar, 'Mute sound', 'كتم الصوت');
  return <div className="entry-controls">
    <button type="button" className="entry-quiet" aria-pressed={!c.preferences.muted} onClick={() => {
      const muted = !c.preferences.muted; c.persist({ muted });
      if (muted) { c.audio.current?.dispose(); c.setAudioState('idle'); } else c.play('unlock');
    }}>{c.preferences.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}{c.preferences.muted ? mutedLabel : enabledLabel}</button>
    <button type="button" className="entry-quiet" disabled={!c.painted || c.phase === 'ENTERING'} onClick={() => c.enter(true)}>{translate(ar, 'Skip', 'تخطي')} <ArrowRight size={14} /></button>
  </div>;
}

function EntryCopy({ c, ar }: ViewProps) {
  let status = translate(ar, 'Bringing your space together…', 'تشكيل مساحتك…');
  if (c.phase === 'READY') status = translate(ar, 'Workspace interface ready', 'واجهة مساحة العمل جاهزة');
  if (c.phase === 'ENTERING') status = translate(ar, 'Welcome to your space', 'أهلًا بك في مساحتك');
  return <div className="entry-copy">
    <p className="entry-eyebrow">YOUR SPACE. IN HARMONY.</p>
    <h1 id="entry-title" dir="ltr">KNOuX <span>Smart</span></h1>
    <p className="entry-subtitle">{translate(ar, 'A calmer space. A clearer mind.', 'مساحة أهدأ. تحكّم أوضح.')}</p>
    <output id="entry-status" className="entry-status" aria-live="polite">{c.phase === 'READY' && <Check size={14} />}{status}</output>
    <button type="button" className="entry-enter" disabled={c.phase !== 'READY'} onClick={() => c.enter()}>{translate(ar, 'Enter Workspace', 'دخول مساحة العمل')}<ArrowRight size={18} /></button>
    <p className="entry-native" data-native={c.native}>{nativeNote(c.native, ar)}</p>
  </div>;
}

function EntryFooter({ c, ar }: ViewProps) {
  return <div className="entry-footer">
    <span dir="ltr">SMARTORGANIZER <em> / </em> LOCAL FIRST</span>
    <div className="entry-options">
      <label><input type="checkbox" checked={c.preferences.always} onChange={e => c.persist({ always: e.target.checked })} />{translate(ar, 'Always show intro', 'عرض المقدمة دائمًا')}</label>
      <label><input type="checkbox" checked={c.reduced} disabled={c.systemReduced} onChange={e => c.persist({ reduced: e.target.checked })} />{translate(ar, 'Reduced motion', 'تقليل الحركة')}</label>
      <button type="button" className="entry-quiet" disabled={c.phase !== 'READY'} onClick={() => { if (c.phaseRef.current === 'READY') { c.phaseRef.current = 'INIT'; c.setPhase('INIT'); } }}><RotateCcw size={13} />{translate(ar, 'Replay', 'إعادة')}</button>
    </div>
    {!c.saved && <output>{translate(ar, 'Preferences apply to this session only', 'التفضيلات لهذه الجلسة فقط')}</output>}
    {c.audioState === 'blocked' && <output>{translate(ar, 'Audio unavailable; you can continue', 'الصوت غير متاح؛ يمكنك المتابعة')}</output>}
  </div>;
}

/** One stable boundary and real workspace mount. Readiness describes the
 * renderer; native provider availability remains separate and authoritative. */
export function CinematicEntry({ children }: Readonly<{ children: ReactNode }>) {
  const { isArabic: ar, currentSection, theme } = useNavigation();
  const c = useEntryController();
  const visible = c.phase !== 'ACTIVE';
  return <div className="cinematic-boundary" data-phase={c.phase} data-reduced={c.reduced} data-home={currentSection === 'home'} data-light={theme === 'light'} data-audio={c.audioState}>
    <div className="entry-atmosphere" aria-hidden="true" />
    <canvas ref={c.canvas} className="entry-particles" role="presentation" />
    <div ref={c.workspace} className="cinematic-workspace" inert={visible} aria-hidden={visible || undefined} data-painted={c.painted}>{children}</div>
    {visible && <dialog open ref={c.overlay} className="entry-overlay" aria-modal="true" aria-labelledby="entry-title" aria-describedby="entry-status" tabIndex={-1} dir={ar ? 'rtl' : 'ltr'} onKeyDown={event => handleEntryKeys(event, c)}>
      <EntryControls c={c} ar={ar} />
      <div className="entry-composition">
        <div className="entry-orbits" aria-hidden="true"><i /><i /><i /></div>
        <div className="entry-medallion" aria-hidden="true"><div className="entry-glass" /><div className="entry-mark"><i /><i /><i /><b /></div><div className="entry-glint" /></div>
        <EntryCopy c={c} ar={ar} />
      </div>
      <EntryFooter c={c} ar={ar} />
    </dialog>}
  </div>;
}

/** Mounted in the real Settings screen; replay preserves application state. */
export function CinematicEntrySettings() {
  const { isArabic: ar } = useNavigation();
  return <button type="button" className="entry-settings-replay" onClick={() => window.dispatchEvent(new Event('knoux:replay-entry'))}><RotateCcw size={15} />{translate(ar, 'Replay KNOuX intro · sound & motion preferences', 'إعادة مقدمة KNOuX · تفضيلات الصوت والحركة')}</button>;
}
