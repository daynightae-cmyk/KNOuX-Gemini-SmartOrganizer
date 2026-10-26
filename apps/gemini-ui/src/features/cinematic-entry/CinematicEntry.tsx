import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { getNativeShell, readBridgeStatus } from '../../native/client';
import { EntryAudio } from './audio';
import { ENTRY_MS, FORMATION_MS, loadPreferences, savePreferences, transition, type EntryEvent, type EntryPhase } from './model';
import { startParticles } from './particles';
import './entry.css';

/** One stable boundary, one real workspace mount. No route replacement, no data
 * fixtures, no Electron changes. READY means the renderer painted, not that an
 * unavailable Windows service has magically become implemented. */
export function CinematicEntry({ children }: { children: ReactNode }) {
  const { isArabic: ar, currentSection, theme } = useNavigation();
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
  const overlay = useRef<HTMLDivElement>(null);
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
    if (phase === 'ENTERING') {
      const timer = setTimeout(() => {
        persist({ seen: true }); send('FINISH'); audio.current?.dispose();
      }, reduced ? 180 : ENTRY_MS);
      return () => clearTimeout(timer);
    }
    if (phase === 'ACTIVE' && painted) {
      const target = returnFocus.current?.isConnected ? returnFocus.current : workspace.current?.querySelector<HTMLElement>('main h1, main h2, main');
      if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    }
  }, [phase, painted, reduced]);

  const visible = phase !== 'ACTIVE';
  const nativeNote = native === 'preview' ? (ar ? 'معاينة المتصفح · جسر Windows غير متاح' : 'Browser preview · Windows bridge unavailable')
    : native === 'pending' ? (ar ? 'جارٍ الاتصال بجسر Windows…' : 'Connecting to Windows bridge…')
    : native === 'ready' ? (ar ? 'جسر التطبيق متصل · تبقى الأذونات مطلوبة' : 'App bridge connected · permissions still apply')
    : (ar ? 'الجسر الأصلي غير متاح · راجع حالة الخدمات داخل التطبيق' : 'Native bridge unavailable · check service status in workspace');
  return <div className="cinematic-boundary" data-phase={phase} data-reduced={reduced} data-home={currentSection === 'home'} data-light={theme === 'light'} data-audio={audioState}>
    <div className="entry-atmosphere" aria-hidden="true" />
    <canvas ref={canvas} className="entry-particles" aria-hidden="true" />
    <div ref={workspace} className="cinematic-workspace" inert={visible} aria-hidden={visible || undefined} data-painted={painted}>{children}</div>
    {visible && <div ref={overlay} className="entry-overlay" role="dialog" aria-modal="true" aria-labelledby="entry-title" aria-describedby="entry-status" tabIndex={-1} dir={ar ? 'rtl' : 'ltr'} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); enter(true); }
      if (event.key === 'Tab') {
        const nodes = Array.from(overlay.current!.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
        const index = nodes.indexOf(document.activeElement as HTMLElement);
        if (event.shiftKey && index <= 0) { event.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!event.shiftKey && (index === nodes.length - 1 || index === -1)) { event.preventDefault(); nodes[0]?.focus(); }
      }
    }}>
      <div className="entry-controls">
        <button type="button" className="entry-quiet" aria-pressed={!preferences.muted} onClick={() => {
          const muted = !preferences.muted; persist({ muted });
          if (muted) { audio.current?.dispose(); setAudioState('idle'); } else play('unlock');
        }}>{preferences.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}{ar ? (preferences.muted ? 'تشغيل الصوت' : 'كتم الصوت') : (preferences.muted ? 'Enable sound' : 'Mute sound')}</button>
        <button type="button" className="entry-quiet" disabled={!painted || phase === 'ENTERING'} onClick={() => enter(true)}>{ar ? 'تخطي' : 'Skip'} <ArrowRight size={14} /></button>
      </div>
      <div className="entry-composition">
        <div className="entry-orbits" aria-hidden="true"><i /><i /><i /></div>
        <div className="entry-medallion" aria-hidden="true">
          <div className="entry-glass" />
          <div className="entry-mark"><i /><i /><i /><b /></div>
          <div className="entry-glint" />
        </div>
        <div className="entry-copy">
          <p className="entry-eyebrow">YOUR SPACE. IN HARMONY.</p>
          <h1 id="entry-title" dir="ltr">KNOuX <span>Smart</span></h1>
          <p className="entry-subtitle">{ar ? 'مساحة أهدأ. تحكّم أوضح.' : 'A calmer space. A clearer mind.'}</p>
          <p id="entry-status" className="entry-status" role="status" aria-live="polite">{phase === 'READY' ? <><Check size={14} />{ar ? 'واجهة مساحة العمل جاهزة' : 'Workspace interface ready'}</> : phase === 'ENTERING' ? (ar ? 'أهلًا بك في مساحتك' : 'Welcome to your space') : (ar ? 'تشكيل مساحتك…' : 'Bringing your space together…')}</p>
          <button type="button" className="entry-enter" disabled={phase !== 'READY'} onClick={() => enter()}>{ar ? 'دخول مساحة العمل' : 'Enter Workspace'}<ArrowRight size={18} /></button>
          <p className="entry-native" data-native={native}>{nativeNote}</p>
        </div>
      </div>
      <div className="entry-footer">
        <span dir="ltr">SMARTORGANIZER <em> / </em> LOCAL FIRST</span>
        <div className="entry-options">
          <label><input type="checkbox" checked={preferences.always} onChange={e => persist({ always: e.target.checked })} />{ar ? 'عرض المقدمة دائمًا' : 'Always show intro'}</label>
          <label><input type="checkbox" checked={reduced} disabled={systemReduced} onChange={e => persist({ reduced: e.target.checked })} />{ar ? 'تقليل الحركة' : 'Reduced motion'}</label>
          <button type="button" className="entry-quiet" disabled={phase !== 'READY'} onClick={() => { if (phaseRef.current === 'READY') { phaseRef.current = 'INIT'; setPhase('INIT'); } }}><RotateCcw size={13} />{ar ? 'إعادة' : 'Replay'}</button>
        </div>
        {!saved && <small role="status">{ar ? 'التفضيلات لهذه الجلسة فقط' : 'Preferences apply to this session only'}</small>}
        {audioState === 'blocked' && <small role="status">{ar ? 'الصوت غير متاح؛ يمكنك المتابعة' : 'Audio unavailable; you can continue'}</small>}
      </div>
    </div>}
  </div>;
}

/** Mounted in the real Settings screen; replay never replaces application state. */
export function CinematicEntrySettings() {
  const { isArabic: ar } = useNavigation();
  return <button type="button" className="entry-settings-replay" onClick={() => window.dispatchEvent(new Event('knoux:replay-entry'))}><RotateCcw size={15} />{ar ? 'إعادة مقدمة KNOuX · تفضيلات الصوت والحركة' : 'Replay KNOuX intro · sound & motion preferences'}</button>;
}
