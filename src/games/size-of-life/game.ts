import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { CREATURES } from './creatures';
import { ART } from './art';

const SLUG = 'size-of-life';
const N = CREATURES.length;
const GROUND = 46; // px between the ground line and the bottom of the scene
const ZOOM_MS = 900;

interface Box {
  left: number;
  w: number;
  h: number;
}
interface Camera {
  x: number;
  /** Natural log of pixels per meter. */
  ls: number;
}

// World layout in meters: everything stands on one ground line, left to right, smallest first.
const BOXES: Box[] = [];
CREATURES.forEach((c, k) => {
  const art = ART[c.id];
  const w = c.dim === 'tall' ? (c.size * art.w) / art.h : c.size;
  const h = c.dim === 'tall' ? c.size : (c.size * art.h) / art.w;
  const prev = BOXES[k - 1];
  // Room for the previous one's name tag, scaled to both neighbors.
  const left = prev ? prev.left + prev.w + 0.5 * prev.w + 0.3 * h : 0;
  BOXES.push({ left, w, h });
});

const UNITS: [number, string][] = [
  [1000, 'km'],
  [1, 'm'],
  [0.01, 'cm'],
  [0.001, 'mm'],
  [1e-6, 'µm'],
  [1e-9, 'nm'],
];

/** A 1-2-5 scale bar length (meters) that draws between roughly 60 and 150 px. */
function scaleBar(pxPerMeter: number): { meters: number; text: string } {
  const raw = 100 / pxPerMeter;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((m) => m * pow * pxPerMeter >= 60) ?? 10;
  const meters = step * pow;
  const [size, name] = UNITS.find(([u, unit]) => meters >= u || unit === 'nm')!;
  return { meters, text: `${Number((meters / size).toPrecision(3))} ${name}` };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function mount(root: HTMLElement): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const el = document.createElement('div');
  el.className = 'g-sol';
  el.tabIndex = -1;
  el.innerHTML = `
    <div class="g-sol-info" aria-live="polite">
      <p class="g-sol-name" data-name></p>
      <p class="g-sol-size" data-size></p>
      <p class="g-sol-fact" data-fact></p>
    </div>
    <div class="g-sol-scene" data-scene role="img">
      <div class="g-sol-ground"></div>
      <div class="g-sol-things" data-things></div>
      <div class="g-sol-tag" data-tag hidden></div>
      <div class="g-sol-scale" aria-hidden="true"><span class="g-sol-bar" data-bar></span><span data-scale-text></span></div>
    </div>
    <div class="g-sol-controls">
      <button type="button" class="btn btn--white" data-back aria-label="Back to the smaller one">◀ Back</button>
      <p class="g-sol-progress"><span data-progress></span><span class="g-sol-furthest" data-furthest></span></p>
      <button type="button" class="btn btn--pink" data-next>Next ▶</button>
    </div>
    <p class="g-sol-hint">Tap Next, swipe, or use the ← → keys</p>`;
  root.append(el);

  const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const scene = q('[data-scene]');
  const things = q('[data-things]');
  const tag = q('[data-tag]');
  const bar = q('[data-bar]');
  const scaleText = q('[data-scale-text]');
  const nameEl = q('[data-name]');
  const sizeEl = q('[data-size]');
  const factEl = q('[data-fact]');
  const progressEl = q('[data-progress]');
  const furthestEl = q('[data-furthest]');
  const backBtn = q<HTMLButtonElement>('[data-back]');
  const nextBtn = q<HTMLButtonElement>('[data-next]');

  let idx = 0;
  let sceneW = 0;
  let sceneH = 0;
  let cam: Camera = { x: 0, ls: 0 };
  let anim: { from: Camera; to: Camera; start: number; lo: number; hi: number } | null = null;
  let frame = 0;
  let done = false;
  let doneEl: HTMLElement | null = null;
  // Seeing the first one counts as reaching it.
  let furthest = getBest(SLUG) ?? saveBest(SLUG, 1).best;
  let furthestAtStart = furthest;
  const nodes = new Map<number, HTMLElement>();

  function nodeFor(k: number): HTMLElement {
    let node = nodes.get(k);
    if (!node) {
      const art = ART[CREATURES[k].id];
      node = document.createElement('div');
      node.className = 'g-sol-thing';
      node.dataset.thing = CREATURES[k].id;
      node.innerHTML = `<svg viewBox="0 0 ${art.w} ${art.h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${art.body}</svg>`;
      things.append(node);
      nodes.set(k, node);
    }
    return node;
  }

  function target(i: number): Camera {
    const cur = BOXES[i];
    const prev = BOXES[i - 1];
    const lo = prev ? prev.left : cur.left;
    const hi = cur.left + cur.w;
    const usableH = Math.max(80, sceneH - GROUND - 46);
    // A long animal can be shorter than the tall one before it, so fit the taller of the two.
    const tallest = Math.max(cur.h, prev ? prev.h : 0);
    const s = Math.min((0.82 * usableH) / tallest, (0.86 * sceneW) / (hi - lo));
    return { x: (lo + hi) / 2, ls: Math.log(s) };
  }

  function draw(c: Camera, lo: number, hi: number): void {
    const s = Math.exp(c.ls);
    const groundY = sceneH - GROUND;
    for (const [k, node] of nodes) {
      if (k < lo - 2 || k > hi) node.style.display = 'none';
    }
    for (let k = Math.max(0, lo - 2); k <= hi; k++) {
      const b = BOXES[k];
      const w = b.w * s;
      const h = b.h * s;
      const node = nodeFor(k);
      if (w < 0.4 && h < 0.4) {
        node.style.display = 'none';
        continue;
      }
      const x = (b.left - c.x) * s + sceneW / 2;
      node.style.display = '';
      node.style.width = `${w}px`;
      node.style.height = `${h}px`;
      node.style.transform = `translate(${x}px, ${groundY - h}px)`;
    }

    const p = idx - 1;
    if (p >= 0 && !done) {
      const b = BOXES[p];
      const cx = (b.left + b.w / 2 - c.x) * s + sceneW / 2;
      const top = sceneH - GROUND - b.h * s;
      tag.hidden = false;
      tag.textContent = `${CREATURES[p].name}`;
      const tw = tag.offsetWidth;
      const tx = Math.min(Math.max(cx - tw / 2, 6), sceneW - tw - 6);
      tag.style.transform = `translate(${tx}px, ${Math.max(4, top - tag.offsetHeight - 10)}px)`;
      tag.style.setProperty('--arrow-x', `${Math.min(Math.max(cx - tx, 12), tw - 12)}px`);
    } else {
      tag.hidden = true;
    }

    const sb = scaleBar(s);
    bar.style.width = `${sb.meters * s}px`;
    scaleText.textContent = sb.text;
  }

  function tick(now: number): void {
    if (!anim) return;
    const t = Math.min(1, (now - anim.start) / ZOOM_MS);
    const e = easeInOut(t);
    cam = { x: anim.from.x + (anim.to.x - anim.from.x) * e, ls: anim.from.ls + (anim.to.ls - anim.from.ls) * e };
    draw(cam, anim.lo, anim.hi);
    if (t < 1) frame = requestAnimationFrame(tick);
    else {
      anim = null;
      draw(cam, idx, idx);
    }
  }

  function showInfo(): void {
    const c = CREATURES[idx];
    nameEl.textContent = c.name;
    sizeEl.textContent = c.label;
    factEl.textContent = c.fact;
    scene.setAttribute('aria-label', `${c.name}, ${c.label}, shown next to the ${idx > 0 ? CREATURES[idx - 1].name : 'scale bar'} at true scale.`);
    progressEl.textContent = `${idx + 1} / ${N}`;
    furthestEl.textContent = furthest > 0 ? `Furthest: ${furthest}` : '';
    backBtn.disabled = idx === 0;
    nextBtn.textContent = idx === N - 1 ? 'Finish 🏁' : 'Next ▶';
    el.dataset.index = String(idx);
  }

  function go(next: number): void {
    if (done) return;
    if (next >= N) return finish();
    if (next < 0 || next === idx) return;
    const from = idx;
    idx = next;
    if (idx + 1 > furthest) {
      furthest = idx + 1;
      saveBest(SLUG, furthest);
    }
    showInfo();
    cancelAnimationFrame(frame);
    const to = target(idx);
    if (reduceMotion.matches || sceneW === 0) {
      anim = null;
      cam = to;
      draw(cam, idx, idx);
      return;
    }
    anim = { from: cam, to, start: performance.now(), lo: Math.min(from, idx), hi: Math.max(from, idx) };
    frame = requestAnimationFrame(tick);
  }

  function finish(): void {
    done = true;
    cancelAnimationFrame(frame);
    tag.hidden = true;
    const { best } = saveBest(SLUG, N);
    furthest = best;
    const isNewBest = furthestAtStart < N;
    doneEl = document.createElement('div');
    doneEl.className = 'g-sol-done';
    doneEl.append(
      createResultPanel(root, {
        label: 'You zoomed through',
        score: `${N} living things`,
        message: 'From a flu virus about 100 nm wide to a honey fungus about 3.8 km across. That is roughly 38 billion times bigger!',
        best: `${best} of ${N}`,
        isNewBest,
        playAgainLabel: '🔁 Start over',
        onPlayAgain: restart,
      }),
    );
    el.append(doneEl);
    el.dataset.state = 'done';
  }

  function restart(): void {
    doneEl?.remove();
    doneEl = null;
    done = false;
    furthestAtStart = furthest;
    el.dataset.state = 'tour';
    idx = 0;
    anim = null;
    cam = target(0);
    showInfo();
    draw(cam, 0, 0);
    nextBtn.focus({ preventScroll: true });
  }

  backBtn.addEventListener('click', () => go(idx - 1));
  nextBtn.addEventListener('click', () => go(idx + 1));

  el.addEventListener('keydown', (e) => {
    if (done || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(idx + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(idx - 1);
    }
  });
  // Let the arrow keys work as soon as someone clicks anywhere in the scene.
  scene.addEventListener('pointerdown', () => el.focus({ preventScroll: true }));

  // Swipe left for bigger, right for smaller.
  let swipe: { id: number; x: number; y: number } | null = null;
  scene.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  scene.addEventListener('pointerup', (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    go(dx < 0 ? idx + 1 : idx - 1);
  });
  scene.addEventListener('pointercancel', () => (swipe = null));

  function measure(): void {
    sceneW = scene.clientWidth;
    sceneH = scene.clientHeight;
    if (!anim) {
      cam = target(idx);
      draw(cam, idx, idx);
    }
  }
  new ResizeObserver(measure).observe(scene);

  el.dataset.state = 'tour';
  showInfo();
  measure();
}
