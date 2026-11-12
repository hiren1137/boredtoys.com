import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { BOTTOM, STOPS, ZONES } from './stops';
import { ART } from './art';

const SLUG = 'the-deep-sea';
const DARK_FROM = 500; // light outlines from here down, so the art stays visible in dark water
const ZONE_CLEARANCE = 150; // px: stops this close to a zone line sit on the right, away from its label

/**
 * Pixels from the surface for a true depth in meters. A log term stretches the busy shallows and a
 * square-root term keeps the deep trip scrollable, while the meter always reads the true depth.
 */
const Y = (d: number) => 600 * Math.log(1 + d / 5) + 150 * Math.sqrt(d);
const TOTAL = Y(BOTTOM);

/** True depth for a pixel offset below the surface. */
function depthAt(px: number): number {
  if (px <= 0) return 0;
  if (px >= TOTAL) return BOTTOM;
  let lo = 0;
  let hi = BOTTOM;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (Y(mid) < px) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const meters = (d: number) => `${Math.round(d).toLocaleString('en-US')} m`;
const feet = (d: number) => `${Math.round(d * 3.28084).toLocaleString('en-US')} ft`;
const zoneAt = (d: number) => [...ZONES].reverse().find((z) => d >= z.depth) ?? ZONES[0];

export function mount(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const el = document.createElement('div');
  el.className = 'g-deep';
  el.innerHTML = `
    <div class="ds-scroll" data-scroll tabindex="0" role="region" aria-label="The ocean. Scroll, swipe or use the arrow keys to dive.">
      <div class="ds-water" data-water>
        <div class="ds-sun" aria-hidden="true"></div>
        <div class="ds-bubbles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>
    <div class="ds-meter" aria-hidden="true">
      <p class="ds-m" data-m>0 m</p>
      <p class="ds-ft"><span data-ft>0 ft</span> · <span data-zone>Sunlight Zone</span></p>
      <p class="ds-best" data-best></p>
    </div>
    <p class="ds-live" data-live role="status" aria-live="polite"></p>
    <div class="ds-mark" aria-hidden="true"></div>
    <p class="ds-hint" data-hint>Scroll, swipe or press ↓ to dive</p>
    <div class="ds-controls">
      <button type="button" class="btn btn--white btn--small" data-up>▲ Back up</button>
      <button type="button" class="btn btn--pink btn--small" data-down>Dive faster ▼</button>
    </div>`;
  root.append(el);

  const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const scroller = q('[data-scroll]');
  const water = q('[data-water]');
  const mEl = q('[data-m]');
  const ftEl = q('[data-ft]');
  const zoneEl = q('[data-zone]');
  const bestEl = q('[data-best]');
  const liveEl = q('[data-live]');
  const hintEl = q('[data-hint]');

  // ---- Build the ocean once; positions are set in layout() ----
  const zoneNodes = ZONES.map((z) => {
    const n = document.createElement('div');
    n.className = 'ds-zone';
    n.innerHTML = `<span class="ds-zone-pill"><b></b> · ${meters(z.depth)}</span><span class="ds-zone-note"></span>`;
    n.querySelector('b')!.textContent = z.name;
    n.querySelector('.ds-zone-note')!.textContent = z.note;
    water.append(n);
    return n;
  });

  let lastSide = 'left';
  const stopNodes = STOPS.map((s) => {
    const art = ART[s.id];
    const nearZone = ZONES.some((z) => Math.abs(Y(z.depth) - Y(s.depth)) < ZONE_CLEARANCE);
    const side = nearZone ? 'right' : lastSide === 'left' ? 'right' : 'left';
    lastSide = side;
    const n = document.createElement('div');
    n.className = `ds-stop ds-${side}${s.depth >= DARK_FROM ? ' ds-dark' : ''}`;
    n.dataset.stop = s.id;
    n.style.setProperty('--s', `${s.size}px`);
    n.innerHTML = `
      <svg class="ds-art" viewBox="0 0 ${art.w} ${art.h}" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${art.body}</g>
      </svg>
      <div class="ds-card"><p class="ds-name"></p><p class="ds-depth">${meters(s.depth)}</p><p class="ds-fact"></p></div>`;
    n.querySelector('.ds-name')!.textContent = s.name;
    n.querySelector('.ds-fact')!.textContent = s.fact;
    water.append(n);
    return n;
  });

  let top = 0; // px from the top of the water element to the surface (half the viewport)
  function layout(): void {
    const keep = depth;
    top = Math.round(scroller.clientHeight / 2);
    const end = top + TOTAL;
    water.style.height = `${end + top}px`;
    const at = (d: number) => `${(top + Y(d)).toFixed(0)}px`;
    water.style.setProperty('--surface', `${top}px`);
    water.style.background = `linear-gradient(#a6dfff 0px, #e9f8ff ${top}px, #45b5ee ${top}px, #1d6ca9 ${at(200)},
      #0d3562 ${at(1000)}, #081a3d ${at(4000)}, #050c23 ${at(6000)}, #03050f ${end}px, #2a2036 ${end}px)`;
    water.style.setProperty('--snow', at(200));
    zoneNodes.forEach((n, i) => (n.style.top = at(ZONES[i].depth)));
    stopNodes.forEach((n, i) => (n.style.top = at(STOPS[i].depth)));
    scroller.scrollTop = Y(keep);
  }

  // ---- Live depth from the scroll position ----
  let depth = 0;
  let deepest = getBest(SLUG) ?? 0;
  const deepestAtStart = deepest;
  let frame = 0;
  let saveTimer = 0;
  let lastZone = '';

  function update(): void {
    frame = 0;
    depth = depthAt(scroller.scrollTop);
    const atBottom = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2;
    if (atBottom) depth = BOTTOM;
    mEl.textContent = meters(depth);
    ftEl.textContent = feet(depth);
    const zone = zoneAt(depth);
    zoneEl.textContent = zone.name;
    if (zone.name !== lastZone) {
      if (lastZone) liveEl.textContent = `${zone.name}, ${meters(zone.depth)}`;
      lastZone = zone.name;
    }
    if (depth > 1) hintEl.hidden = true;
    if (depth > deepest + 0.5) {
      deepest = depth;
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => saveBest(SLUG, Math.round(deepest)), 400);
    }
    bestEl.textContent = deepest >= 1 ? `Deepest: ${meters(deepest)}` : '';
    if (atBottom) arrive();
    else if (depth < BOTTOM - 300) dismissed = false;
  }
  scroller.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  });
  addEventListener('pagehide', () => {
    if (deepest >= 1) saveBest(SLUG, Math.round(deepest));
  });

  // Handle scroll keys ourselves: Chrome lets a keyboard scroll spill over to the page at the very bottom.
  scroller.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const page = scroller.clientHeight * 0.85;
    const delta: Record<string, number> = {
      ArrowDown: 60,
      ArrowUp: -60,
      PageDown: page,
      PageUp: -page,
      ' ': e.shiftKey ? -page : page,
      Home: -Infinity,
      End: Infinity,
    };
    const d = delta[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const max = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(0, Math.min(max, scroller.scrollTop + d));
  });

  // ---- Buttons: hop to the next or previous stop ----
  const go = (d: number) =>
    scroller.scrollTo({ top: Y(d), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  q('[data-down]').addEventListener('click', () => {
    const next = STOPS.find((s) => s.depth > depth + 0.5);
    go(next ? next.depth : BOTTOM);
  });
  q('[data-up]').addEventListener('click', () => {
    const prev = [...STOPS].reverse().find((s) => s.depth < depth - 0.5);
    go(prev ? prev.depth : 0);
  });

  // ---- Finish card at Challenger Deep ----
  let doneEl: HTMLElement | null = null;
  let dismissed = false;
  let arriveTimer = 0;
  function arrive(): void {
    if (doneEl || dismissed || arriveTimer) return;
    // A short pause so you see the bottom before the card covers it.
    arriveTimer = window.setTimeout(() => {
      arriveTimer = 0;
      if (scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 2) return;
      showDone();
    }, 700);
  }

  function showDone(): void {
    const { best } = saveBest(SLUG, BOTTOM);
    deepest = best;
    const stay = document.createElement('button');
    stay.type = 'button';
    stay.className = 'btn btn--white';
    stay.textContent = 'Stay down here';
    stay.addEventListener('click', () => {
      dismissed = true;
      closeDone();
      scroller.focus({ preventScroll: true });
    });
    const wrap = document.createElement('div');
    wrap.className = 'ds-done-extra';
    wrap.append(stay);
    doneEl = document.createElement('div');
    doneEl.className = 'ds-done';
    doneEl.append(
      createResultPanel(root, {
        label: 'You reached',
        score: meters(BOTTOM),
        shareScore: meters(BOTTOM),
        message: 'All the way to Challenger Deep. Mount Everest would fit down here with about 2 km of water to spare.',
        best: meters(best),
        isNewBest: deepestAtStart < BOTTOM,
        playAgainLabel: '🔁 Start over',
        onPlayAgain: () => {
          closeDone();
          scroller.scrollTop = 0;
          scroller.focus({ preventScroll: true });
        },
        extra: wrap,
      }),
    );
    el.append(doneEl);
    el.dataset.state = 'done';
  }

  function closeDone(): void {
    doneEl?.remove();
    doneEl = null;
    el.dataset.state = 'dive';
  }

  el.dataset.state = 'dive';
  new ResizeObserver(() => layout()).observe(scroller);
  layout();
  update();
}
