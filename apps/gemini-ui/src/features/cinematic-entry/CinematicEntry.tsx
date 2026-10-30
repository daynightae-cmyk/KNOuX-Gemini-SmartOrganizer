import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';
import { ArrowRight, Check, ChevronRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { getNativeShell, readBridgeStatus } from '../../native/client';
import { EntryAudio } from './audio';
import { ENTRY_MS, FORMATION_MS, loadPreferences, savePreferences, transition, type EntryEvent, type EntryPhase } from './model';
import { startParticles } from './particles';
import portalMark from '../../visual/assets/knoux-portal-mark.png';
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
    <button type="button" className="entry-quiet entry-sound" aria-pressed={!c.preferences.muted} onClick={() => {
      const muted = !c.preferences.muted; c.persist({ muted });
      if (muted) { c.audio.current?.dispose(); c.setAudioState('idle'); } else c.play('unlock');
    }}>{c.preferences.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}<span className="entry-label">{c.preferences.muted ? mutedLabel : enabledLabel}</span></button>
    <button type="button" className="entry-quiet entry-skip" disabled={!c.painted || c.phase === 'ENTERING'} onClick={() => c.enter(true)}><span className="entry-label">{translate(ar, 'Skip', 'تخطي')}</span><ArrowRight size={14} /></button>
  </div>;
}

/** The official KNOuX ribbon mark, keyed from the brand asset (its day-light
 * disc removed at build time) so the real emblem can glow on the night glass. */
function PortalMark() {
  return <div className="entry-mark">
    <img src={portalMark} alt="" aria-hidden="true" draggable={false} />
    <img className="entry-mark-sheen" src={portalMark} alt="" aria-hidden="true" draggable={false} />
  </div>;
}

/** Deterministic starfield: dense enough to read as thousands of stars through
 * fine points, built once as static SVG. No per-frame work. */
const STARS = Array.from({ length: 340 }, (_, i) => {
  const angle = i * 2.399963229728653;
  const radius = Math.sqrt((i + 0.5) / 340);
  const bright = i % 41 === 0;
  return {
    x: 800 + Math.cos(angle) * radius * 795,
    y: 450 + Math.sin(angle) * radius * 442,
    r: bright ? 1.8 : i % 13 === 0 ? 1.15 : 0.65,
    o: 0.16 + ((i * 29) % 100) / 100 * 0.58,
    twinkle: i % 23 === 0,
    delay: -((i * 0.37) % 6),
  };
});
const BURSTS = STARS.filter((_, i) => i % 29 === 5).slice(0, 12);

/** Day-light bokeh: soft out-of-focus glints from the reference, static. */
const BOKEH = [
  { x: '9%', y: '22%', s: 26, o: 0.55 }, { x: '17%', y: '63%', s: 14, o: 0.5 },
  { x: '24%', y: '12%', s: 10, o: 0.45 }, { x: '4%', y: '48%', s: 38, o: 0.35 },
  { x: '31%', y: '78%', s: 18, o: 0.4 }, { x: '68%', y: '9%', s: 12, o: 0.5 },
  { x: '78%', y: '31%', s: 22, o: 0.45 }, { x: '88%', y: '57%', s: 30, o: 0.4 },
  { x: '93%', y: '18%', s: 10, o: 0.5 }, { x: '73%', y: '72%', s: 16, o: 0.45 },
  { x: '61%', y: '86%', s: 26, o: 0.3 }, { x: '44%', y: '6%', s: 9, o: 0.4 },
  { x: '52%', y: '92%', s: 22, o: 0.32 }, { x: '36%', y: '42%', s: 8, o: 0.3 },
];

function Starfield() {
  return <svg className="entry-stars" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g fill="currentColor">
      {STARS.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.o} className={star.twinkle ? 'entry-twinkle' : undefined} style={star.twinkle ? { animationDelay: `${star.delay}s` } : undefined} />)}
      {BURSTS.map((star, i) => <path key={i} className="entry-star-burst" d={`M${star.x} ${star.y - 8}q1 7 8 8-7 1-8 8-1-7-8-8 7-1 8-8Z`} opacity={0.55 + (i % 3) * 0.12} />)}
    </g>
  </svg>;
}

const BUBBLES = [
  { x: '1.5%', y: '68%', s: '13.5%', d: '12s', delay: '-1s', far: false },
  { x: '7%', y: '46%', s: '4.8%', d: '9s', delay: '-4s', far: true },
  { x: '16.5%', y: '85%', s: '3.6%', d: '14s', delay: '-7s', far: true },
  { x: '86%', y: '53%', s: '8.8%', d: '11s', delay: '-2s', far: false },
  { x: '93.5%', y: '68%', s: '4.4%', d: '13s', delay: '-8s', far: true },
  { x: '78.5%', y: '84%', s: '5.4%', d: '10s', delay: '-5s', far: false },
  { x: '9.5%', y: '19%', s: '3.4%', d: '15s', delay: '-3s', far: true },
  { x: '87.5%', y: '15%', s: '2.9%', d: '12s', delay: '-9s', far: true },
  { x: '69%', y: '8%', s: '2.5%', d: '16s', delay: '-6s', far: true },
];

const SPARKS = [
  { x: '16%', y: '33%', s: 4, d: '5s', delay: '-1s' },
  { x: '73%', y: '23%', s: 5, d: '6s', delay: '-3s' },
  { x: '84%', y: '46%', s: 3, d: '4.4s', delay: '-2s' },
  { x: '10%', y: '57%', s: 3.5, d: '7s', delay: '-4s' },
  { x: '28%', y: '78%', s: 4.5, d: '5.6s', delay: '-2.5s' },
  { x: '64%', y: '84%', s: 3, d: '6.4s', delay: '-5s' },
  { x: '38%', y: '12%', s: 2.6, d: '5.2s', delay: '-3.5s' },
  { x: '92%', y: '31%', s: 2.4, d: '4.8s', delay: '-1.5s' },
];

const vars = (values: Record<string, string | number>) => values as CSSProperties;

function Ribbons({ front }: Readonly<{ front: boolean }>) {
  const core = front ? 'M -70 612 C 260 468 468 512 706 588 C 952 666 1170 556 1470 398' : 'M -60 418 C 240 246 462 196 700 196 C 950 194 1180 264 1460 408';
  const drift = front ? 'portal-ribbon-drift-b' : '';
  return <svg viewBox="0 0 1400 760" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g className={`portal-ribbon-drift ${drift}`}>
      <path className="ribbon-halo" d={core} />
      <path className="ribbon-bloom" d={core} />
      <path className="ribbon-core" d={core} />
      <path className="ribbon-fine" d={core} />
      {front
        ? <ellipse className="ribbon-core" cx="700" cy="520" rx="520" ry="128" transform="rotate(-9 700 520)" opacity="0.55" strokeDasharray="240 90 520 120" />
        : <ellipse className="ribbon-halo" cx="700" cy="300" rx="548" ry="124" transform="rotate(-15 700 300)" />}
    </g>
    {front && <>
      <circle className="portal-spark" cx="212" cy="536" r="3.2" />
      <circle className="portal-spark" cx="880" cy="626" r="2.6" style={{ animationDelay: '-1.8s' }} />
      <circle className="portal-spark" cx="1250" cy="496" r="3.6" style={{ animationDelay: '-3.2s' }} />
    </>}
  </svg>;
}

/** Decorative portal: glass sphere, ribbons, crystal planets, cosmic floor. */
function PortalScene() {
  return <div className="portal-scene" aria-hidden="true">
    <svg className="portal-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <linearGradient id="portal-ribbon-b" x1="0" y1="0.2" x2="1" y2="0.8">
          <stop offset="0" stopColor="#7a1fd0" stopOpacity="0" />
          <stop offset="0.16" stopColor="#b44dff" stopOpacity="0.85" />
          <stop offset="0.38" stopColor="#ffffff" />
          <stop offset="0.56" stopColor="#f0d2ff" />
          <stop offset="0.76" stopColor="#c46bff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7a1fd0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="portal-ribbon-h" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#8a2be2" stopOpacity="0" />
          <stop offset="0.4" stopColor="#d98bff" stopOpacity="0.75" />
          <stop offset="0.62" stopColor="#ffd9ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#8a2be2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="portal-ribbon-day" x1="0" y1="0.2" x2="1" y2="0.8">
          <stop offset="0" stopColor="#b08ae0" stopOpacity="0" />
          <stop offset="0.2" stopColor="#b98ff0" stopOpacity="0.85" />
          <stop offset="0.44" stopColor="#d9c4f2" />
          <stop offset="0.66" stopColor="#a97fe0" />
          <stop offset="0.86" stopColor="#b08ae0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#b08ae0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="portal-ribbon-day-h" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#a97fe0" stopOpacity="0" />
          <stop offset="0.45" stopColor="#c9aee9" stopOpacity="0.6" />
          <stop offset="0.65" stopColor="#e3d3f7" stopOpacity="0.7" />
          <stop offset="1" stopColor="#a97fe0" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
    <div className="portal-ribbons portal-ribbons-back"><Ribbons front={false} /></div>
    <div className="portal-rays" />
    <div className="portal-floor" />
    <div className="portal-mirror" />
    <div className="portal-medallion entry-medallion">
      <div className="portal-orb-aura" />
      <div className="portal-orb" />
      <div className="portal-orb-grain" />
      <div className="portal-orb-sheen" />
      <div className="portal-orb-flare" />
      <div className="portal-orb-base" />
      <div className="portal-orb-rim" />
    </div>
    <div className="portal-ribbons portal-ribbons-front"><Ribbons front /></div>
    <div className="portal-horizon" />
    <div className="portal-bubbles">
      {BUBBLES.map((bubble, i) => <i key={i} data-far={bubble.far || undefined} style={vars({ '--bx': bubble.x, '--by': bubble.y, '--bs': bubble.s, '--bd': bubble.d, '--bdelay': bubble.delay })} />)}
    </div>
    <div className="portal-sparks">
      {SPARKS.map((spark, i) => <i key={i} style={vars({ '--sx': spark.x, '--sy': spark.y, '--ss': `${spark.s}px`, '--sd': spark.d, '--sdelay': spark.delay })} />)}
    </div>
  </div>;
}

function EntryCopy({ c, ar }: ViewProps) {
  const ready = c.phase === 'READY';
  const entering = c.phase === 'ENTERING';
  // The release dissolves the exact frame the visitor saw. Only the small live
  // status changes; headline and note never swap mid-dissolve.
  const settled = ready || entering;
  const headline = settled
    ? translate(ar, 'Workspace Ready', 'مساحة العمل جاهزة')
    : translate(ar, 'Preparing Workspace', 'جارٍ تجهيز مساحة العمل');
  const note = settled
    ? translate(ar, 'KNOuX Smart is ready to help you achieve more.', 'KNOuX Smart جاهز لمساعدتك على تحقيق المزيد.')
    : translate(ar, 'Bringing your space together…', 'جارٍ تشكيل مساحتك…');
  const status = ready
    ? translate(ar, 'Workspace interface ready', 'واجهة مساحة العمل جاهزة')
    : entering
      ? translate(ar, 'Your workspace is opening', 'مساحة عملك تُفتح الآن')
      : translate(ar, 'Assembling your workspace', 'جارٍ تجميع مساحة عملك');
  const cta = translate(ar, 'Enter Workspace', 'دخول مساحة العمل');
  return <div className="entry-copy">
    <PortalMark />
    <h1 id="entry-title" dir="ltr">KNOuX <span>Smart</span></h1>
    <p className="entry-quote">{translate(ar, '“Intelligence that works with you.”', '«ذكاء يعمل معك.»')}</p>
    <div className="entry-check" aria-hidden="true"><Check size={18} /><i /><i /><i /><i /></div>
    <p className="entry-headline">{headline}</p>
    <p className="entry-note">{note}</p>
    {(c.phase === 'INIT' || c.phase === 'FORMING') && <div className="entry-dots" aria-hidden="true"><i /><i /><i /></div>}
    <p className="entry-meta">
      <output id="entry-status" className="entry-status" aria-live="polite">{ready && <Check size={12} />}{status}</output>
      <span className="entry-meta-sep" aria-hidden="true">·</span>
      <span className="entry-native" data-native={c.native}>{nativeNote(c.native, ar)}</span>
    </p>
    <button type="button" className="entry-enter" aria-label={cta} disabled={c.phase !== 'READY'} onClick={() => c.enter()}>
      <span className="entry-enter-badge" aria-hidden="true"><ChevronRight size={19} strokeWidth={3} /></span>
      <span className="entry-enter-text">{cta}</span>
    </button>
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
    <div className="entry-atmosphere" aria-hidden="true">
      <div className="entry-nebula entry-nebula-a" />
      <div className="entry-nebula entry-nebula-b" />
      <div className="entry-nebula entry-nebula-c" />
      <Starfield />
      <div className="entry-bokeh">{BOKEH.map((dot, i) => <i key={i} style={vars({ '--bx': dot.x, '--by': dot.y, '--bs': `${dot.s}px`, '--bo': dot.o })} />)}</div>
    </div>
    <div aria-hidden="true" inert><canvas ref={c.canvas} className="entry-particles" /></div>
    <div ref={c.workspace} className="cinematic-workspace" inert={visible} aria-hidden={visible || undefined} data-painted={c.painted}>{children}</div>
    {visible && <dialog open ref={c.overlay} className="entry-overlay" aria-modal="true" aria-labelledby="entry-title" aria-describedby="entry-status" tabIndex={-1} dir={ar ? 'rtl' : 'ltr'} onKeyDown={event => handleEntryKeys(event, c)}>
      <EntryControls c={c} ar={ar} />
      <div className="entry-composition">
        <div className="entry-stage">
          <PortalScene />
          <EntryCopy c={c} ar={ar} />
        </div>
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
