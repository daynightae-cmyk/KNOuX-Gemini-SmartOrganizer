import type { EntryPhase } from './model';
type ParticleState = { phase: EntryPhase; reduced: boolean; home: boolean; light: boolean };
type FrameGeometry = { ambient: boolean; forming: number; release: number; radius: number };

/** Deterministic golden-angle distribution; coherent logarithmic spirals rather
 * than random confetti. One canvas survives formation, release and ambience. */
export function startParticles(canvas: HTMLCanvasElement, read: () => ParticleState) {
  const boundary = canvas.closest('.cinematic-boundary');
  let ctx: CanvasRenderingContext2D | null;
  try { ctx = canvas.getContext('2d'); } catch { return () => {}; }
  if (!ctx) return () => {}; // CSS medallion remains functional without graphics
  let frame = 0, previous = 0, elapsed = 0, lastTime = 0, phaseTime = 0;
  let lastPhase: EntryPhase = 'INIT';
  let width = 0, height = 0, centerY = 0;
  let settled = false;
  const constrained = (navigator.hardwareConcurrency || 4) <= 4;
  const count = constrained ? 100 : 230;
  const resize = () => {
    width = window.innerWidth; height = window.innerHeight;
    const medallion = boundary?.querySelector('.entry-medallion')?.getBoundingClientRect();
    centerY = medallion ? medallion.top + medallion.height / 2 : height * .43;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const geometry = (state: ParticleState, age: number): FrameGeometry => ({
    ambient: state.phase === 'ACTIVE', forming: Math.min(1, elapsed / 3000),
    release: state.phase === 'ENTERING' ? Math.min(1, age / 1600) : 0,
    radius: Math.min(width * .18, height * .28, 235),
  });
  const assemble = (i: number, x: number, y: number, g: FrameGeometry) => {
    const { radius, forming, release } = g;
    // A third of the motes lock onto the original ribbon glyph's three
    // diagonal segments and separate pearl. The solid CSS mark takes over.
    const segment = Math.floor(i / 3) % 4;
    const u = Math.sin(i * 17.3) * radius * .19;
    const tilt = segment === 1 ? -.75 : .75;
    const targetX = segment === 3 ? width / 2 + radius * .18 : width / 2 - radius * .06 + u;
    const targetY = segment === 3 ? centerY : centerY + (segment - 1) * radius * .2 + u * tilt;
    const magnetic = Math.min(1, forming * 1.3);
    return { x: x + (targetX - x) * magnetic * (1 - release), y: y + (targetY - y) * magnetic * (1 - release) };
  };
  const orbitPosition = (i: number, g: FrameGeometry) => {
    const { ambient, forming, release, radius } = g;
    const seed = (Math.sin(i * 127.1) * 43758.5453) % 1;
    const depth = .3 + Math.abs(seed) * .7;
    const angle = i * 2.39996 + elapsed * (ambient ? .000025 : .00018) * (i % 2 ? 1 : -1) + release * 3.8;
    const scattered = radius + (1 - forming) * Math.max(width, height) * depth;
    const orbit = scattered * (.85 + depth * .65) + release * Math.max(width, height) * depth;
    const x = ambient ? ((i * 173.7 + Math.sin(elapsed * .00012 + i) * 32) % width) : width / 2 + Math.cos(angle) * orbit;
    const y = ambient ? height * (.22 + (i % 7) * .1) + Math.sin(angle) * 18 : centerY + Math.sin(angle) * orbit * .42 + Math.sin(i * 2.1) * radius * .28;
    return { x, y, depth, angle, orbit };
  };
  const particleAlpha = (g: FrameGeometry, depth: number, assembling: boolean) => {
    if (g.ambient) return .12 + depth * .16;
    const fade = assembling && !g.release ? 1 - g.forming : 1;
    return (.25 + depth * .65) * (1 - g.release * .8) * fade;
  };
  const particleColor = (light: boolean, pearl: boolean) => {
    if (pearl) return light ? '255,255,255' : '235,220,255';
    return light ? '118,53,220' : '179,131,255';
  };
  const drawParticle = (i: number, state: ParticleState, g: FrameGeometry) => {
    const { ambient, release } = g;
    const { x, y, depth, angle, orbit } = orbitPosition(i, g);
    const assembling = !ambient && i % 3 === 0;
    let position = { x, y };
    if (assembling) position = assemble(i, x, y, g);
    const alpha = particleAlpha(g, depth, assembling);
    const color = particleColor(state.light, i % 4 === 0);
    ctx.fillStyle = `rgba(${color},${alpha})`;
    ctx.beginPath(); ctx.arc(position.x, position.y, (ambient ? 1 : .7 + depth * 1.7), 0, Math.PI * 2); ctx.fill();
    if (!ambient && !assembling && i % 4 === 0) {
      ctx.strokeStyle = `rgba(185,145,255,${alpha * .32})`;
      ctx.lineWidth = depth;
      ctx.beginPath(); ctx.ellipse(width / 2, centerY, orbit, orbit * .42, 0, angle - .08 - release * .24, angle); ctx.stroke();
    }
  };
  const drawScene = (state: ParticleState, age: number) => {
    const g = geometry(state, age);
    ctx.clearRect(0, 0, width, height);
    const total = g.ambient ? 28 : count;
    for (let i = 0; i < total; i++) drawParticle(i, state, g);
  };
  const advance = (time: number, state: ParticleState) => {
    elapsed += lastTime ? Math.min(time - lastTime, 80) : 0;
    lastTime = time; previous = time;
    if (state.phase !== lastPhase) {
      if (state.phase === 'FORMING' && lastPhase !== 'INIT') { elapsed = 0; resize(); }
      phaseTime = elapsed; lastPhase = state.phase;
    }
  };
  const render = (time: number) => {
    const state = read();
    if (document.hidden || (state.phase === 'ACTIVE' && (!state.home || settled))) { frame = 0; return; }
    const interval = state.phase === 'ACTIVE' || constrained ? 1000 / 30 : 1000 / 60;
    if (time - previous < interval) { frame = requestAnimationFrame(render); return; }
    advance(time, state);
    const age = elapsed - phaseTime;
    const ambient = state.phase === 'ACTIVE';
    drawScene(state, age);
    // Ambient settles after 12 seconds. Reduced motion gets one static frame.
    if ((ambient && age > 12000) || state.reduced) { settled = ambient; frame = 0; return; }
    frame = requestAnimationFrame(render);
  };
  const wake = () => { lastTime = 0; if (!frame && !document.hidden) frame = requestAnimationFrame(render); };
  const reset = () => { resize(); wake(); };
  resize(); wake();
  const observer = new MutationObserver(() => {
    if (read().phase !== 'ACTIVE') settled = false;
    wake();
  });
  observer.observe(boundary!, { attributes: true, attributeFilter: ['data-phase', 'data-reduced', 'data-home', 'data-light'] });
  window.addEventListener('resize', reset);
  document.addEventListener('visibilitychange', wake);
  return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', reset); document.removeEventListener('visibilitychange', wake); ctx.clearRect(0, 0, width, height); };
}
