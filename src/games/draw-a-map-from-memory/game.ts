import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { PLACES, type Place } from './shapes';
import { boxOf, fitTo, project, scoreDrawing, type Box, type Pt } from './score';

const SLUG = 'draw-a-map-from-memory';
const ROUND = 6;
const SIZE = 500;
const MIN_SIZE = 70;
const INK = '#1f1a2e';
const REAL_FILL = 'rgba(107, 227, 168, 0.45)';
const REAL_LINE = '#1f9d55';

interface Entry {
  place: Place;
  strokes: Pt[][];
  score: number;
  skipped: boolean;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function verdict(score: number): string {
  if (score >= 90) return 'Did you trace that off a globe? Cartographers are nervous.';
  if (score >= 75) return 'A sailor could navigate with this. Mostly.';
  if (score >= 60) return 'Clearly the right place. A few bays went on holiday.';
  if (score >= 40) return 'The general vibe is there. The coastline has opinions.';
  if (score >= 20) return 'A brand new country has been discovered. Population: you.';
  return 'This map would get explorers very, very lost.';
}

function roundMessage(avg: number): string {
  if (avg >= 80) return 'Your mental map is sharp. Atlas companies should be worried.';
  if (avg >= 65) return 'Great map memory. Most of your countries would pass a geography test.';
  if (avg >= 45) return 'Solid work. Some coastlines wandered off, but the shapes are there.';
  if (avg >= 25) return 'Your world is a little wobbly. Spin a globe and try again.';
  return 'You invented a whole new planet. It looks fun to visit.';
}

function pickPlaces(): Place[] {
  const pool = PLACES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUND);
}

const projected = new Map<string, Pt[][]>();
function realShape(place: Place): Pt[][] {
  let s = projected.get(place.id);
  if (!s) projected.set(place.id, (s = project(place.rings)));
  return s;
}

/** Where the real outline goes in a reveal: on top of the drawing, or centered when there is none. */
function overlayBox(e: Entry): Box {
  return e.strokes.length ? boxOf(e.strokes) : { cx: SIZE / 2, cy: SIZE / 2, size: SIZE * 0.72 };
}

function paint(ctx: CanvasRenderingContext2D, scale: number, strokes: Pt[][], real?: Pt[][], realAlpha = 1): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (real && realAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = realAlpha;
    ctx.beginPath();
    for (const ring of real) {
      ring.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
    }
    ctx.fillStyle = REAL_FILL;
    ctx.fill('evenodd');
    ctx.strokeStyle = REAL_LINE;
    ctx.lineWidth = 3 / Math.max(scale, 0.5);
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 5;
  for (const s of strokes) {
    if (s.length === 1) {
      ctx.beginPath();
      ctx.arc(s[0].x, s[0].y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    s.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
}

function makeCanvas(cssSize: number, className: string, label: string): [HTMLCanvasElement, CanvasRenderingContext2D, number] {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const c = document.createElement('canvas');
  c.width = Math.round(cssSize * dpr);
  c.height = Math.round(cssSize * dpr);
  c.className = className;
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  return [c, c.getContext('2d')!, (cssSize * dpr) / SIZE];
}

function miniature(e: Entry, cssSize: number): HTMLCanvasElement {
  const label = e.skipped ? `The real shape of ${e.place.name}` : `Your drawing of ${e.place.name} with the real shape on top`;
  const [c, ctx, scale] = makeCanvas(cssSize, 'mp-mini', label);
  paint(ctx, scale, e.strokes, fitTo(realShape(e.place), overlayBox(e)));
  return c;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-map';
  root.append(el);

  let places: Place[] = [];
  let entries: Entry[] = [];
  let index = 0;
  let detach: (() => void) | null = null;

  function setState(s: string): void {
    el.dataset.state = s;
    detach?.();
    detach = null;
    el.replaceChildren();
  }

  function renderStart(): void {
    setState('start');
    const best = getBest(SLUG);
    const box = document.createElement('div');
    box.className = 'mp-start';
    box.innerHTML = `
      <p class="mp-kicker">${ROUND} places · ${PLACES.length} possible maps</p>
      <p class="mp-big">Can you draw the world without looking?</p>
      <p>You get the name of a country, island or continent. Draw its outline from memory, then see the real shape laid over yours.</p>
      ${best != null ? `<p class="mp-best">Your best round: ${best}%</p>` : ''}
      <button type="button" class="btn btn--big btn--mint" data-start>🗺️ Start drawing</button>
      <p class="mp-small">Drawing needs a mouse, trackpad or finger. On a keyboard you can press Skip to see each real map.</p>`;
    box.querySelector('[data-start]')!.addEventListener('click', startRound);
    el.append(box);
  }

  function startRound(): void {
    places = pickPlaces();
    entries = [];
    index = 0;
    renderDraw();
  }

  function renderDraw(): void {
    setState('draw');
    const place = places[index];
    const wrap = document.createElement('div');
    wrap.className = 'mp-play';
    wrap.innerHTML = `
      <div class="mp-top">
        <span class="mp-pill">Map ${index + 1} / ${ROUND}</span>
        <h2 class="mp-prompt">Draw <strong></strong></h2>
        <p class="mp-note"></p>
      </div>
      <div class="mp-board" data-board></div>
      <p class="mp-hint" data-hint aria-live="polite">Draw the outline in one or more strokes.</p>
      <div class="mp-tools">
        <button type="button" class="mp-btn" data-undo>↶ Undo</button>
        <button type="button" class="mp-btn" data-clear>🗑️ Clear</button>
        <button type="button" class="mp-btn" data-skip>⏭️ Skip</button>
        <button type="button" class="btn btn--mint mp-done" data-done>✅ Done</button>
      </div>`;
    wrap.querySelector('.mp-prompt strong')!.textContent = place.name;
    wrap.querySelector('.mp-note')!.textContent = place.note;
    el.append(wrap);

    const board = wrap.querySelector<HTMLElement>('[data-board]')!;
    const hint = wrap.querySelector<HTMLElement>('[data-hint]')!;
    const cssSize = Math.max(240, Math.min(440, board.clientWidth || 440));
    const [cv, ctx, scale] = makeCanvas(cssSize, 'mp-canvas', `Blank map area. Draw the outline of ${place.name} with your mouse or finger.`);
    cv.removeAttribute('role');
    cv.style.width = `${cssSize}px`;
    cv.style.height = `${cssSize}px`;
    board.append(cv);

    let strokes: Pt[][] = [];
    const history: Pt[][][] = [];
    let current: Pt[] | null = null;
    let active: number | null = null;
    let queued = 0;
    const redraw = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        paint(ctx, scale, strokes);
      });
    };
    paint(ctx, scale, strokes);

    const toLocal = (e: PointerEvent): Pt => {
      const r = cv.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
    };
    cv.addEventListener('pointerdown', (e) => {
      if (active !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      active = e.pointerId;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch {
        // Drawing still works without capture.
      }
      history.push(strokes.slice());
      current = [toLocal(e)];
      strokes = [...strokes, current];
      redraw();
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== active || !current) return;
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) {
        const p = toLocal(ev);
        const last = current[current.length - 1];
        if (Math.hypot(p.x - last.x, p.y - last.y) >= 1.5) current.push(p);
      }
      redraw();
    });
    const up = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = null;
      current = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    // Stops the browser reading a stroke as half of a double tap, which can swallow a quick tap on Done.
    const noGesture = (e: TouchEvent) => e.cancelable && e.preventDefault();
    cv.addEventListener('touchstart', noGesture, { passive: false });
    cv.addEventListener('touchend', noGesture, { passive: false });

    const undo = () => {
      const prev = history.pop();
      if (!prev) return;
      strokes = prev;
      redraw();
    };
    wrap.querySelector('[data-undo]')!.addEventListener('click', undo);
    wrap.querySelector('[data-clear]')!.addEventListener('click', () => {
      if (!strokes.length) return;
      history.push(strokes);
      strokes = [];
      redraw();
    });
    wrap.querySelector('[data-skip]')!.addEventListener('click', () => finish(place, [], true));
    wrap.querySelector('[data-done]')!.addEventListener('click', () => {
      if (!strokes.length) {
        hint.textContent = 'Draw something first, or press Skip.';
        return;
      }
      if (boxOf(strokes).size < MIN_SIZE) {
        hint.textContent = 'That is tiny! Draw it bigger so it fills more of the box.';
        return;
      }
      finish(place, strokes, false);
    });

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener('keydown', onKey);
    detach = () => {
      document.removeEventListener('keydown', onKey);
      if (queued) cancelAnimationFrame(queued);
    };
  }

  function finish(place: Place, strokes: Pt[][], skipped: boolean): void {
    const score = skipped ? 0 : scoreDrawing(strokes, realShape(place)).score;
    entries.push({ place, strokes, score, skipped });
    renderReveal();
  }

  function renderReveal(): void {
    setState('reveal');
    const e = entries[entries.length - 1];
    const wrap = document.createElement('div');
    wrap.className = 'mp-reveal';
    wrap.innerHTML = `
      <div class="mp-top">
        <span class="mp-pill">Map ${index + 1} / ${ROUND}</span>
        <h2 class="mp-prompt">The real <strong></strong></h2>
      </div>
      <div class="mp-board" data-board></div>
      <p class="mp-legend">${e.skipped ? '' : '<span class="mp-key mp-key--ink"></span> Yours '}<span class="mp-key mp-key--real"></span> The real shape</p>
      <p class="mp-score" aria-live="polite">${e.skipped ? 'Skipped' : `${e.score}%`}</p>
      <p class="mp-verdict">${e.skipped ? 'No drawing this time. Have a good look at the real one!' : verdict(e.score)}</p>
      <button type="button" class="btn btn--mint btn--big" data-next>${index + 1 < ROUND ? 'Next map ➜' : 'See my results ➜'}</button>`;
    wrap.querySelector('.mp-prompt strong')!.textContent = e.place.name.replace(/^the /, '');
    el.append(wrap);

    const board = wrap.querySelector<HTMLElement>('[data-board]')!;
    const cssSize = Math.max(220, Math.min(360, board.clientWidth || 360));
    const label = e.skipped ? `The real shape of ${e.place.name}` : `Your drawing of ${e.place.name} with the real shape laid over it`;
    const [cv, ctx, scale] = makeCanvas(cssSize, 'mp-canvas mp-canvas--reveal', label);
    cv.style.width = `${cssSize}px`;
    cv.style.height = `${cssSize}px`;
    board.append(cv);
    const real = fitTo(realShape(e.place), overlayBox(e));
    if (reducedMotion()) paint(ctx, scale, e.strokes, real);
    else {
      const t0 = performance.now();
      let raf = 0;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 450);
        paint(ctx, scale, e.strokes, real, k);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      detach = () => cancelAnimationFrame(raf);
    }

    const next = wrap.querySelector<HTMLButtonElement>('[data-next]')!;
    next.addEventListener('click', () => {
      index++;
      if (index < ROUND) renderDraw();
      else renderResult();
    });
    next.focus({ preventScroll: true });
  }

  function renderResult(): void {
    setState('result');
    const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
    const { best, isNewBest } = saveBest(SLUG, avg);
    const gallery = document.createElement('ul');
    gallery.className = 'mp-gallery';
    gallery.setAttribute('aria-label', 'Your maps with the real shapes on top');
    for (const e of entries) {
      const li = document.createElement('li');
      const name = document.createElement('p');
      name.className = 'mp-gname';
      name.innerHTML = '<strong></strong> <span></span>';
      name.querySelector('strong')!.textContent = e.place.name.replace(/^the /, '');
      name.querySelector('span')!.textContent = e.skipped ? 'skipped' : `${e.score}%`;
      li.append(miniature(e, 96), name);
      gallery.append(li);
    }
    const wrap = document.createElement('div');
    wrap.className = 'mp-result';
    wrap.append(
      createResultPanel(root, {
        label: `Average accuracy over ${ROUND} maps`,
        score: `${avg}%`,
        message: roundMessage(avg),
        best: `${best}%`,
        isNewBest,
        extra: gallery,
        hideShare: entries.every((e) => e.skipped),
        onPlayAgain: startRound,
      }),
    );
    el.append(wrap);
  }

  renderStart();
}
