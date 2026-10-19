import './game.css';
import { getBest, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { FLAGS, KEYS, PALETTE, renderFlag, type Flag, type Key } from './flags';
import { createSurface, packHex, type Surface } from './paint';
import { scoreDrawing } from './score';

const SLUG = 'draw-flags-from-memory';
const ROUND = 5;
const BASE_W = 480;
const SIZES = [
  { id: 's', label: 'Small', r: 5 },
  { id: 'm', label: 'Medium', r: 12 },
  { id: 'l', label: 'Large', r: 28 },
];
const COLOR_NAMES: Record<Key, string> = {
  white: 'White',
  black: 'Black',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
};

type Tool = 'brush' | 'fill';
interface Entry {
  flag: Flag;
  score: number;
  blank: boolean;
  drawing: HTMLCanvasElement;
}

function verdict(score: number): string {
  if (score >= 92) return 'Flag expert. Do you have these on your bedroom wall?';
  if (score >= 80) return 'Really close. Only a sharp-eyed tourist would notice.';
  if (score >= 65) return 'Very recognizable. Nicely remembered!';
  if (score >= 45) return 'Some of the right colors in some of the right places.';
  if (score >= 20) return 'This might be the flag of a brand new country.';
  return 'An abstract masterpiece. Not a flag, though.';
}

function roundMessage(avg: number): string {
  if (avg >= 85) return 'Your flag memory is world class. The United Nations should hire you.';
  if (avg >= 70) return 'Great memory. Most of your flags would fly just fine.';
  if (avg >= 50) return 'Not bad! A few of your flags got a little creative.';
  if (avg >= 30) return 'You remembered the vibes, if not the details.';
  return 'Brand new countries everywhere. Maybe study a map and try again.';
}

function pickFlags(): Flag[] {
  const pool = FLAGS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUND);
}

function flagCanvas(flag: Flag, width: number, label: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round(width * flag.ratio);
  c.className = 'fl-flag';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  const ctx = c.getContext('2d');
  if (ctx) renderFlag(ctx, flag, c.width, c.height);
  return c;
}

function copyCanvas(src: HTMLCanvasElement, width: number, label: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round((width * src.height) / src.width);
  c.className = 'fl-flag fl-flag--mine';
  c.setAttribute('role', 'img');
  c.setAttribute('aria-label', label);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, 0, 0, c.width, c.height);
  }
  return c;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-flags';
  root.append(el);

  let flags: Flag[] = [];
  let entries: Entry[] = [];
  let index = 0;
  let color: Key = 'red';
  let tool: Tool = 'brush';
  let size = SIZES[1];
  let surface: Surface | null = null;
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
    box.className = 'fl-start';
    box.innerHTML = `
      <p class="fl-kicker">${ROUND} countries · ${FLAGS.length} possible flags</p>
      <p class="fl-big">Can you draw a country's flag without looking?</p>
      <p>You get a country name and a blank flag. Paint it from memory, then see the real one and your accuracy score.</p>
      ${best != null ? `<p class="fl-best">Your best round: ${best}%</p>` : ''}
      <button type="button" class="btn btn--big btn--mint" data-start>🎨 Start drawing</button>
      <p class="fl-keys">Tip: the paint bucket fills big areas in one tap.</p>`;
    box.querySelector('[data-start]')!.addEventListener('click', startRound);
    el.append(box);
  }

  function startRound(): void {
    flags = pickFlags();
    entries = [];
    index = 0;
    renderDraw();
  }

  function renderDraw(): void {
    setState('draw');
    const flag = flags[index];
    const W = BASE_W;
    const H = Math.round(BASE_W * flag.ratio);
    surface = createSurface(W, H);
    const wrap = document.createElement('div');
    wrap.className = 'fl-play';
    wrap.innerHTML = `
      <div class="fl-top">
        <span class="fl-pill">Flag ${index + 1} / ${ROUND}</span>
        <h2 class="fl-prompt">Draw the flag of <strong>${flag.country}</strong></h2>
      </div>
      <div class="fl-stage">
        <canvas class="fl-canvas" width="${W}" height="${H}" tabindex="0" aria-label="Blank flag for ${flag.country}. Draw with your mouse or finger. With a keyboard, use the arrow keys to move, Space to paint, B for brush, F for the paint bucket and number keys 1 to 7 for colors."></canvas>
        <div class="fl-cursor" hidden></div>
      </div>
      <div class="fl-tools">
        <div class="fl-colors" role="group" aria-label="Paint colors">
          ${KEYS.map((k, i) => `<button type="button" class="fl-swatch" data-color="${k}" style="--sw:${PALETTE[k]}" aria-label="${COLOR_NAMES[k]} (key ${i + 1})" aria-pressed="${k === color}"></button>`).join('')}
        </div>
        <div class="fl-row">
          <div class="fl-seg" role="group" aria-label="Tool">
            <button type="button" class="fl-btn" data-tool="brush" aria-pressed="${tool === 'brush'}">🖌️ Brush</button>
            <button type="button" class="fl-btn" data-tool="fill" aria-pressed="${tool === 'fill'}">🪣 Fill</button>
          </div>
          <div class="fl-seg" role="group" aria-label="Brush size">
            ${SIZES.map((s) => `<button type="button" class="fl-btn fl-size" data-size="${s.id}" aria-label="${s.label} brush" aria-pressed="${s === size}"><span style="--d:${4 + s.r / 2.5}px"></span></button>`).join('')}
          </div>
          <div class="fl-seg">
            <button type="button" class="fl-btn" data-undo>↶ Undo</button>
            <button type="button" class="fl-btn" data-clear>🗑️ Clear</button>
          </div>
        </div>
      </div>
      <div class="fl-actions">
        <button type="button" class="btn btn--mint btn--big" data-done>✅ Done, show the real flag</button>
      </div>`;
    el.append(wrap);

    const cv = wrap.querySelector<HTMLCanvasElement>('.fl-canvas')!;
    const ctx = cv.getContext('2d')!;
    const img = new ImageData(new Uint8ClampedArray(surface.data.buffer as ArrayBuffer), W, H);
    const cursor = wrap.querySelector<HTMLElement>('.fl-cursor')!;
    let queued = 0;
    const paint = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        ctx.putImageData(img, 0, 0);
      });
    };
    paint();

    const sync = () => {
      wrap.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === color)));
      wrap.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
      wrap.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === size.id)));
      cv.dataset.tool = tool;
    };
    sync();
    wrap.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((b) =>
      b.addEventListener('click', () => {
        color = b.dataset.color as Key;
        sync();
      }),
    );
    wrap.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) =>
      b.addEventListener('click', () => {
        tool = b.dataset.tool as Tool;
        sync();
      }),
    );
    wrap.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) =>
      b.addEventListener('click', () => {
        size = SIZES.find((s) => s.id === b.dataset.size) ?? size;
        tool = 'brush';
        sync();
      }),
    );
    wrap.querySelector('[data-undo]')!.addEventListener('click', () => {
      if (surface?.undo()) paint();
    });
    wrap.querySelector('[data-clear]')!.addEventListener('click', () => {
      if (!surface || surface.isEmpty()) return;
      surface.snapshot();
      surface.clear();
      paint();
    });
    wrap.querySelector('[data-done]')!.addEventListener('click', finishFlag);

    const toLocal = (e: PointerEvent): [number, number] => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    const applyAt = (x: number, y: number, px = x, py = y, first = true) => {
      if (!surface) return;
      const c = packHex(PALETTE[color]);
      if (tool === 'fill') {
        if (!first) return;
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= W || yi >= H || surface.data[yi * W + xi] === c) return;
        surface.snapshot();
        surface.fill(x, y, c);
      } else {
        if (first) surface.snapshot();
        surface.line(px, py, x, y, size.r, c);
      }
      paint();
    };

    let active: number | null = null;
    let last: [number, number] = [0, 0];
    cv.addEventListener('pointerdown', (e) => {
      if (active !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      active = e.pointerId;
      cursor.hidden = true;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch {
        // Drawing still works without capture.
      }
      last = toLocal(e);
      applyAt(last[0], last[1]);
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== active || tool !== 'brush') return;
      const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) {
        const p = toLocal(ev);
        applyAt(p[0], p[1], last[0], last[1], false);
        last = p;
      }
    });
    const up = (e: PointerEvent) => {
      if (e.pointerId === active) active = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    // Keyboard drawing: a cursor that moves with the arrow keys.
    let kx = W / 2;
    let ky = H / 2;
    let painting = false;
    const placeCursor = () => {
      const s = cv.clientWidth / W;
      const d = (tool === 'fill' ? 6 : size.r * 2) * s;
      cursor.style.width = `${d}px`;
      cursor.style.height = `${d}px`;
      cursor.style.left = `${cv.offsetLeft + cv.clientLeft + kx * s - d / 2}px`;
      cursor.style.top = `${cv.offsetTop + cv.clientTop + ky * s - d / 2}px`;
    };
    cv.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 4 : 12;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        const ox = kx;
        const oy = ky;
        kx = Math.max(0, Math.min(W - 1, kx + m[0]));
        ky = Math.max(0, Math.min(H - 1, ky + m[1]));
        if (painting && tool === 'brush') applyAt(kx, ky, ox, oy, false);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (tool === 'fill') applyAt(kx, ky);
        else {
          painting = !painting;
          if (painting) applyAt(kx, ky);
        }
      } else return;
      cursor.hidden = false;
      cursor.classList.toggle('is-painting', painting);
      placeCursor();
    });
    cv.addEventListener('blur', () => {
      painting = false;
      cursor.hidden = true;
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) return;
      if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (surface?.undo()) paint();
        return;
      }
      if (e.ctrlKey) return;
      const k = e.key.toLowerCase();
      const n = Number(k);
      if (n >= 1 && n <= KEYS.length) color = KEYS[n - 1];
      else if (k === 'b') tool = 'brush';
      else if (k === 'f') tool = 'fill';
      else if (k === 'z') {
        if (surface?.undo()) paint();
        return;
      } else return;
      sync();
      if (!cursor.hidden) placeCursor();
    };
    document.addEventListener('keydown', onKey);
    detach = () => {
      document.removeEventListener('keydown', onKey);
      if (queued) cancelAnimationFrame(queued);
    };
    if (index > 0) cv.focus({ preventScroll: true });
  }

  function finishFlag(): void {
    if (!surface) return;
    const flag = flags[index];
    const blank = surface.isEmpty();
    const score = blank ? 0 : scoreDrawing(surface, flag);
    const full = document.createElement('canvas');
    full.width = surface.w;
    full.height = surface.h;
    full.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(surface.data.slice().buffer), surface.w, surface.h), 0, 0);
    const drawing = copyCanvas(full, 240, `Your drawing of the flag of ${flag.country}`);
    entries.push({ flag, score, blank, drawing });
    renderReveal();
  }

  function renderReveal(): void {
    setState('reveal');
    const e = entries[entries.length - 1];
    const wrap = document.createElement('div');
    wrap.className = 'fl-reveal';
    wrap.innerHTML = `
      <div class="fl-top">
        <span class="fl-pill">Flag ${index + 1} / ${ROUND}</span>
        <h2 class="fl-prompt">The flag of <strong>${e.flag.country}</strong></h2>
      </div>
      <div class="fl-compare">
        <figure><div class="fl-frame" data-mine></div><figcaption>Yours</figcaption></figure>
        <figure><div class="fl-frame" data-real></div><figcaption>The real one</figcaption></figure>
      </div>
      <p class="fl-score" aria-live="polite">${e.score}%</p>
      <p class="fl-verdict">${e.blank ? 'A blank flag! Bold, but it does not count.' : verdict(e.score)}</p>
      <button type="button" class="btn btn--mint btn--big" data-next>${index + 1 < ROUND ? 'Next flag ➜' : 'See my results ➜'}</button>`;
    wrap.querySelector('[data-mine]')!.append(copyCanvas(e.drawing, 240, `Your drawing of the flag of ${e.flag.country}`));
    wrap.querySelector('[data-real]')!.append(flagCanvas(e.flag, 240, `The real flag of ${e.flag.country}`));
    const next = wrap.querySelector<HTMLButtonElement>('[data-next]')!;
    next.addEventListener('click', () => {
      index++;
      if (index < ROUND) renderDraw();
      else renderResult();
    });
    el.append(wrap);
    next.focus({ preventScroll: true });
  }

  function renderResult(): void {
    setState('result');
    const avg = Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
    const { best, isNewBest } = saveBest(SLUG, avg);
    const gallery = document.createElement('ul');
    gallery.className = 'fl-gallery';
    gallery.setAttribute('aria-label', 'Your drawings next to the real flags');
    for (const e of entries) {
      const li = document.createElement('li');
      const name = document.createElement('p');
      name.className = 'fl-gname';
      name.innerHTML = `<strong></strong> <span>${e.score}%</span>`;
      name.querySelector('strong')!.textContent = e.flag.country.replace(/^the /, 'The ');
      const pair = document.createElement('div');
      pair.className = 'fl-pair';
      pair.append(copyCanvas(e.drawing, 120, `Your drawing of the flag of ${e.flag.country}`), flagCanvas(e.flag, 120, `The real flag of ${e.flag.country}`));
      li.append(name, pair);
      gallery.append(li);
    }
    const legend = document.createElement('p');
    legend.className = 'fl-legend';
    legend.textContent = 'Left: your drawing. Right: the real flag.';
    const extra = document.createElement('div');
    extra.append(legend, gallery);
    const wrap = document.createElement('div');
    wrap.className = 'fl-result';
    wrap.append(
      createResultPanel(root, {
        label: `Average accuracy over ${ROUND} flags`,
        score: `${avg}%`,
        message: roundMessage(avg),
        best: `${best}%`,
        isNewBest,
        extra,
        onPlayAgain: startRound,
      }),
    );
    el.append(wrap);
  }

  renderStart();
}
