import { useEffect, useRef } from 'react';
import type { AppTheme, DomainSection } from '../context/NavigationContext';

/**
 * Ambient AI orb field for the living-glass section header.
 *
 * It is decoration only: a full-width canvas behind the identity copy, the
 * scene artwork and the orbit instrument. Three rules keep it honest:
 *  - it never carries a number, a label or a hit target;
 *  - motion is continuous but calm, and stops completely for reduced motion;
 *  - real app activity (organization updates, live workbench opens) makes the
 *    field flare briefly, which is why the constellation reacts when services
 *    actually run instead of pulsing on a fake timer.
 */

type OrbKind = 'accent' | 'light' | 'cyan' | 'magenta';

interface Orb {
  ax: number;
  ay: number;
  axAmp: number;
  ayAmp: number;
  fx: number;
  fy: number;
  px: number;
  py: number;
  fx2: number;
  fy2: number;
  px2: number;
  py2: number;
  r: number;
  alpha: number;
  kind: OrbKind;
  twinkle: number;
  phase: number;
  big: boolean;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Events that mean the product is actually doing measured work. */
const ACTIVITY_EVENTS = [
  'knoux:organization-updated',
  'knoux:live-organization',
  'knoux:storage-cleanup-live',
  'knoux:studio-overview',
  'knoux:open-commands',
];

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  }
  return value >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let colorProbe: CanvasRenderingContext2D | null | undefined;

function parseRgb(raw: string, fallback: Rgb): Rgb {
  if (typeof document === 'undefined') return fallback;
  if (colorProbe === undefined) colorProbe = document.createElement('canvas').getContext('2d');
  if (!colorProbe) return fallback;
  colorProbe.fillStyle = '#ffffff';
  colorProbe.fillStyle = raw;
  const resolved = String(colorProbe.fillStyle);
  if (resolved === '#ffffff' && raw.trim().toLowerCase() !== '#ffffff' && raw.trim().toLowerCase() !== 'white') {
    return fallback;
  }
  if (resolved.startsWith('#')) {
    const hex = resolved.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  const channels = resolved.match(/\d+/g);
  if (!channels || channels.length < 3) return fallback;
  return { r: Number(channels[0]), g: Number(channels[1]), b: Number(channels[2]) };
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color.r},${color.g},${color.b},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

function makeSprite(color: Rgb): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const context = sprite.getContext('2d');
  if (!context) return sprite;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, rgba(color, 0.95));
  gradient.addColorStop(0.14, rgba(color, 0.7));
  gradient.addColorStop(0.38, rgba(color, 0.24));
  gradient.addColorStop(0.7, rgba(color, 0.06));
  gradient.addColorStop(1, rgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return sprite;
}

function createOrbs(width: number, height: number, section: DomainSection): Orb[] {
  const random = mulberry32(hash(`knoux-hero-orbs:${section}`));
  const count = Math.max(26, Math.min(46, Math.round(width / 32)));
  const kinds: OrbKind[] = ['accent', 'accent', 'light', 'cyan', 'accent', 'magenta'];
  const orbs: Orb[] = [];
  for (let index = 0; index < count; index += 1) {
    orbs.push({
      ax: 0.03 + random() * 0.94,
      ay: 0.1 + random() * 0.8,
      axAmp: 0.012 + random() * 0.034,
      ayAmp: 0.018 + random() * 0.052,
      fx: 0.05 + random() * 0.15,
      fy: 0.05 + random() * 0.15,
      px: random() * Math.PI * 2,
      py: random() * Math.PI * 2,
      fx2: 0.1 + random() * 0.22,
      fy2: 0.1 + random() * 0.2,
      px2: random() * Math.PI * 2,
      py2: random() * Math.PI * 2,
      r: 1.1 + Math.pow(random(), 1.4) * 2.8,
      alpha: 0.3 + random() * 0.45,
      kind: kinds[Math.floor(random() * kinds.length)],
      twinkle: 0.45 + random() * 1.1,
      phase: random() * Math.PI * 2,
      big: false,
    });
  }
  // A handful of soft bokeh bodies give the field depth without stealing focus.
  for (let index = 0; index < 5; index += 1) {
    orbs.push({
      ax: 0.06 + random() * 0.88,
      ay: 0.14 + random() * 0.72,
      axAmp: 0.02 + random() * 0.05,
      ayAmp: 0.03 + random() * 0.06,
      fx: 0.03 + random() * 0.06,
      fy: 0.03 + random() * 0.06,
      px: random() * Math.PI * 2,
      py: random() * Math.PI * 2,
      fx2: 0.05 + random() * 0.1,
      fy2: 0.05 + random() * 0.1,
      px2: random() * Math.PI * 2,
      py2: random() * Math.PI * 2,
      r: 24 + random() * 40,
      alpha: 0.035 + random() * 0.05,
      kind: index % 3 === 0 ? 'light' : index % 3 === 1 ? 'accent' : 'magenta',
      twinkle: 0.3 + random() * 0.5,
      phase: random() * Math.PI * 2,
      big: true,
    });
  }
  return orbs;
}

export function HeaderOrbField({ section, theme }: { section: DomainSection; theme: AppTheme }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const styles = getComputedStyle(host);
    const cssValue = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const palette = {
      accent: parseRgb(cssValue('--knx-section-accent', cssValue('--knx-accent', '#a978ff')), { r: 169, g: 120, b: 255 }),
      light: parseRgb(cssValue('--knx-section-light', cssValue('--knx-cyan', '#46e0ff')), { r: 70, g: 224, b: 255 }),
      cyan: parseRgb(cssValue('--knx-cyan', '#46e0ff'), { r: 70, g: 224, b: 255 }),
      magenta: parseRgb(cssValue('--knx-magenta', '#ed7fff'), { r: 237, g: 127, b: 255 }),
    };
    const sprites: Record<OrbKind, HTMLCanvasElement> = {
      accent: makeSprite(palette.accent),
      light: makeSprite(palette.light),
      cyan: makeSprite(palette.cyan),
      magenta: makeSprite(palette.magenta),
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionQuery.matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let energy = 0.5;
    const pointer = { x: -10000, y: -10000, active: false };
    let orbs = createOrbs(320, 320, section);

    const draw = (now: number) => {
      if (width < 2 || height < 2) return;
      const time = now / 1000;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = theme === 'dark' ? 'lighter' : 'source-over';

      // One slow aurora band travels across the header, so the field is never
      // static even between activity flares.
      const sweep = 0.12 + ((time * 0.011) % 1.07);
      const aurora = context.createRadialGradient(
        width * sweep, height * 0.55, 0,
        width * sweep, height * 0.6, width * 0.44,
      );
      aurora.addColorStop(0, rgba(palette.accent, 0.06 + energy * 0.06));
      aurora.addColorStop(0.55, rgba(palette.light, 0.03 + energy * 0.03));
      aurora.addColorStop(1, rgba(palette.accent, 0));
      context.fillStyle = aurora;
      context.fillRect(0, 0, width, height);

      const positioned = orbs.map((orb) => {
        let x = (orb.ax
          + Math.sin(time * orb.fx + orb.px) * orb.axAmp
          + Math.sin(time * orb.fx2 + orb.px2) * orb.axAmp * 0.32) * width;
        let y = (orb.ay
          + Math.cos(time * orb.fy + orb.py) * orb.ayAmp
          + Math.sin(time * orb.fy2 + orb.py2) * orb.ayAmp * 0.3) * height;
        if (pointer.active && !orb.big) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          const pull = Math.max(0, 1 - distance / 150);
          if (pull > 0 && distance > 0.5) {
            x += (dx / distance) * pull * 14;
            y += (dy / distance) * pull * 14;
          }
        }
        const twinkle = orb.big
          ? 1
          : 0.72 + 0.28 * Math.sin(time * orb.twinkle + orb.phase);
        return { orb, x, y, twinkle };
      });

      for (const item of positioned) {
        if (!item.orb.big) continue;
        const radius = item.orb.r * (1 + energy * 0.12);
        context.globalAlpha = item.orb.alpha * (0.8 + 0.2 * Math.sin(time * 0.24 + item.orb.phase));
        context.drawImage(sprites[item.orb.kind], item.x - radius * 4, item.y - radius * 4, radius * 8, radius * 8);
      }

      const linkDistance = 120 + energy * 30;
      context.lineWidth = 1;
      for (let a = 0; a < positioned.length; a += 1) {
        const first = positioned[a];
        if (first.orb.big) continue;
        for (let b = a + 1; b < positioned.length; b += 1) {
          const second = positioned[b];
          if (second.orb.big) continue;
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.hypot(dx, dy);
          if (distance > linkDistance) continue;
          const strength = (1 - distance / linkDistance) * (0.15 + energy * 0.24);
          context.strokeStyle = rgba(palette.accent, strength);
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }

      for (const item of positioned) {
        if (item.orb.big) continue;
        const radius = item.orb.r * (1 + energy * 0.5);
        const alpha = Math.min(0.96, item.orb.alpha * item.twinkle * (1 + energy * 0.65));
        context.globalAlpha = alpha;
        context.drawImage(sprites[item.orb.kind], item.x - radius * 5, item.y - radius * 5, radius * 10, radius * 10);
        // A crisp core keeps the constellation legible at 1x screenshots while
        // the sprite supplies the soft bloom around it.
        context.globalAlpha = Math.min(0.98, alpha * 0.95);
        context.fillStyle = rgba(palette[item.orb.kind], 1);
        context.beginPath();
        context.arc(item.x, item.y, Math.max(0.7, radius * 0.42), 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      const delta = last ? Math.min(64, now - last) : 16;
      last = now;
      energy *= Math.exp(-delta / 1500);
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || document.hidden || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const nextWidth = Math.round(rect.width);
      const nextHeight = Math.round(rect.height);
      if (nextWidth < 40 || nextHeight < 40) return;
      if (Math.abs(nextWidth - width) < 2 && Math.abs(nextHeight - height) < 2) return;
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(1.6, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      orbs = createOrbs(width, height, section);
      canvas.dataset.orbCount = String(orbs.length);
      canvas.dataset.orbMotion = reduced ? 'still' : 'running';
      if (reduced) draw(performance.now());
    };

    const pulse = () => {
      energy = 1;
      if (reduced) draw(performance.now());
      else start();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onMotionPreference = () => {
      reduced = motionQuery.matches;
      canvas.dataset.orbMotion = reduced ? 'still' : 'running';
      if (reduced) {
        stop();
        draw(performance.now());
      } else {
        start();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    start();
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, pulse);
    document.addEventListener('visibilitychange', onVisibility);
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    motionQuery.addEventListener('change', onMotionPreference);

    return () => {
      stop();
      observer.disconnect();
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, pulse);
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      motionQuery.removeEventListener('change', onMotionPreference);
    };
  }, [section, theme]);

  return <canvas ref={canvasRef} className="knx-hero-orb-field" aria-hidden="true" data-testid="hero-orb-field" />;
}
