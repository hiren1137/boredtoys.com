import './game.css';
import { getJSON, saveBest, setJSON } from '../../lib/storage';
import { buildShareRow, readContext } from '../../lib/share';
import { ERASER, PALETTE, REACTIONS, SAND, swatch } from './elements';
import { createSim } from './sim';

const SLUG = 'falling-sand-game';
const FOUND_KEY = `${SLUG}:found`;
const TOTAL = REACTIONS.length;
const STEP_MS = 1000 / 60;

export function mount(root: HTMLElement): void {
  const share = readContext(root);
  const el = document.createElement('div');
  el.className = 'g-sand';
  el.innerHTML = `
    <div class="fs-bar">
      <button type="button" class="btn btn--small btn--white" data-pause aria-pressed="false">⏸ Pause</button>
      <label class="fs-brush">Brush <input type="range" min="1" max="10" value="3" data-brush aria-label="Brush size"><output data-brush-out>3</output></label>
      <button type="button" class="btn btn--small btn--white" data-clear>🧹 Clear</button>
      <button type="button" class="btn btn--small btn--white" data-save>📷 Save<span class="fs-long"> picture</span></button>
      <button type="button" class="btn btn--small btn--sky" data-book aria-expanded="false">📖 <span class="fs-long">Reactions </span><span data-count></span></button>
    </div>
    <div class="fs-main">
      <div class="fs-picker" role="toolbar" aria-label="Elements" data-picker></div>
      <div class="fs-view" data-view>
        <canvas tabindex="0" aria-label="Sandbox. Draw with your mouse or finger. With a keyboard, use the arrow keys to move the brush, Enter to pour, P to pause, and the bracket keys to change brush size."></canvas>
        <div class="fs-cursor" data-cursor hidden></div>
        <p class="fs-hint" data-hint>Pick an element, then draw in the box</p>
        <p class="fs-toast" data-toast role="status" aria-live="polite"></p>
        <section class="fs-book" data-bookpanel hidden aria-label="Reaction book">
          <div class="fs-book-inner">
            <p class="fs-book-brand">${share.siteName}</p>
            <h2 class="fs-book-title">Reaction Book</h2>
            <p class="fs-book-score" data-book-score></p>
            <p class="fs-book-sub" data-book-sub></p>
            <div class="fs-book-actions">
              <button type="button" class="btn btn--mint" data-close>▶ Back to the sandbox</button>
              <button type="button" class="btn btn--white" data-save>📷 Save picture</button>
            </div>
            <div data-share></div>
            <ul class="fs-book-list" data-book-list></ul>
          </div>
        </section>
      </div>
    </div>`;
  root.append(el);

  const $ = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const canvas = $<HTMLCanvasElement>('canvas');
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const view = $<HTMLElement>('[data-view]');
  const picker = $<HTMLElement>('[data-picker]');
  const pauseBtn = $<HTMLButtonElement>('[data-pause]');
  const brushIn = $<HTMLInputElement>('[data-brush]');
  const brushOut = $<HTMLOutputElement>('[data-brush-out]');
  const countEl = $<HTMLElement>('[data-count]');
  const bookBtn = $<HTMLButtonElement>('[data-book]');
  const book = $<HTMLElement>('[data-bookpanel]');
  const hint = $<HTMLElement>('[data-hint]');
  const toast = $<HTMLElement>('[data-toast]');
  const cursor = $<HTMLElement>('[data-cursor]');

  const allTime = new Set(getJSON<string[]>(FOUND_KEY, []).filter((id) => REACTIONS.some((r) => r.id === id)));
  const session = new Set<string>();
  let current = SAND;
  let brush = 3;
  let paused = false;
  let inView = true;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let frame = 0;
  let dirty = true;
  let image: ImageData | null = null;
  let buf: Uint32Array | null = null;
  let toastTimer = 0;

  const sim = createSim(10, 10, (index) => {
    const r = REACTIONS[index];
    session.add(r.id);
    const isNew = !allTime.has(r.id);
    if (isNew) {
      allTime.add(r.id);
      setJSON(FOUND_KEY, [...allTime]);
      saveBest(SLUG, allTime.size);
    }
    say(allTime.size === TOTAL && isNew ? `🏆 You found all ${TOTAL} reactions!` : `${isNew ? '✨ New reaction' : '🔁 Reaction'}: ${r.name}`);
    renderCount();
    if (!book.hidden) renderBook();
  });

  function say(msg: string): void {
    toast.textContent = msg;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  const shareScore = () => `${allTime.size}/${TOTAL} reactions`;
  function renderCount(): void {
    countEl.textContent = `${allTime.size}/${TOTAL}`;
    bookBtn.setAttribute('aria-label', `Reaction book: ${allTime.size} of ${TOTAL} reactions found`);
  }

  // ---------- element picker ----------
  for (const p of PALETTE) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fs-el';
    b.dataset.el = String(p.id);
    b.setAttribute('aria-pressed', String(p.id === current));
    b.innerHTML = `<span class="fs-dot${p.id === ERASER ? ' fs-dot--eraser' : ''}" style="background:${swatch(p.id)}"></span>${p.label}`;
    if (p.key) b.title = `${p.label} (key ${p.key.toUpperCase()})`;
    b.addEventListener('click', () => pick(p.id));
    picker.append(b);
  }
  function pick(id: number): void {
    current = id;
    picker.querySelectorAll<HTMLButtonElement>('.fs-el').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.el) === id)));
  }

  // ---------- sizing ----------
  function resize(): void {
    const rect = view.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const cell = Math.max(3, Math.round(Math.max(rect.width / 200, rect.height / 150)));
    const w = Math.max(40, Math.floor(rect.width / cell));
    const h = Math.max(40, Math.floor(rect.height / cell));
    if (w === sim.w && h === sim.h && image) return;
    sim.resize(w, h);
    canvas.width = w;
    canvas.height = h;
    image = ctx.createImageData(w, h);
    buf = new Uint32Array(image.data.buffer);
    dirty = true;
    kx = -1;
    placeCursor();
  }

  // ---------- drawing ----------
  let drawing: number | null = null;
  let drawEl = SAND;
  let px = -1;
  let py = -1;
  let kx = -1;
  let ky = -1;

  function cellAt(e: PointerEvent): [number, number] {
    const r = canvas.getBoundingClientRect();
    return [Math.floor(((e.clientX - r.left) / r.width) * sim.w), Math.floor(((e.clientY - r.top) / r.height) * sim.h)];
  }

  function stroke(x0: number, y0: number, x1: number, y1: number, id: number): void {
    const dist = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const steps = Math.max(1, Math.ceil(dist / Math.max(1, brush / 2)));
    let placed = 0;
    for (let s = 0; s <= steps; s++) {
      const k = s / steps;
      placed += sim.paint(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), brush - 1, id);
    }
    if (placed) {
      dirty = true;
      if (!hint.hidden) hint.hidden = true;
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (drawing !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    canvas.focus({ preventScroll: true });
    cursor.hidden = true;
    drawing = e.pointerId;
    drawEl = e.button === 2 ? ERASER : current;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Drawing still works without capture.
    }
    [px, py] = cellAt(e);
    stroke(px, py, px, py, drawEl);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== drawing) return;
    const [x, y] = cellAt(e);
    if (x === px && y === py) return;
    stroke(px, py, x, y, drawEl);
    px = x;
    py = y;
  });
  const stop = (e: PointerEvent) => {
    if (e.pointerId === drawing) drawing = null;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function placeCursor(): void {
    if (kx < 0) {
      kx = sim.w >> 1;
      ky = sim.h >> 2;
    }
    kx = Math.max(0, Math.min(sim.w - 1, kx));
    ky = Math.max(0, Math.min(sim.h - 1, ky));
    const sx = canvas.clientWidth / sim.w;
    const sy = canvas.clientHeight / sim.h;
    const size = (brush * 2 - 1) * sx;
    cursor.style.width = `${size}px`;
    cursor.style.height = `${(brush * 2 - 1) * sy}px`;
    cursor.style.transform = `translate(${(kx + 0.5) * sx - size / 2}px, ${(ky + 0.5) * sy - ((brush * 2 - 1) * sy) / 2}px)`;
  }

  canvas.addEventListener('keydown', (e) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      cursor.hidden = false;
      placeCursor();
      const ox = kx;
      const oy = ky;
      kx = Math.max(0, Math.min(sim.w - 1, kx + m[0] * 2));
      ky = Math.max(0, Math.min(sim.h - 1, ky + m[1] * 2));
      if (e.shiftKey) stroke(ox, oy, kx, ky, current);
      placeCursor();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      cursor.hidden = false;
      placeCursor();
      stroke(kx, ky, kx, ky, current);
    }
  });
  canvas.addEventListener('blur', () => (cursor.hidden = true));

  el.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape' && !book.hidden) return closeBook();
    if (k === 'p') return togglePause();
    if (k === '[' || k === ']') {
      setBrush(brush + (k === ']' ? 1 : -1));
      return;
    }
    const p = PALETTE.find((q) => q.key && q.key === k);
    if (p) pick(p.id);
  });

  // ---------- controls ----------
  function setBrush(v: number): void {
    brush = Math.max(1, Math.min(10, v));
    brushIn.value = String(brush);
    brushOut.textContent = String(brush);
    placeCursor();
  }
  brushIn.addEventListener('input', () => setBrush(Number(brushIn.value)));

  function togglePause(): void {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶ Play' : '⏸ Pause';
    pauseBtn.setAttribute('aria-pressed', String(paused));
    el.classList.toggle('is-paused', paused);
  }
  pauseBtn.addEventListener('click', togglePause);

  $<HTMLButtonElement>('[data-clear]').addEventListener('click', () => {
    sim.clear();
    dirty = true;
    say('🧹 All clean. Go make a mess.');
  });

  el.querySelectorAll<HTMLButtonElement>('[data-save]').forEach((b) => b.addEventListener('click', savePicture));
  function savePicture(): void {
    const scale = Math.max(2, Math.round(1200 / sim.w));
    const out = document.createElement('canvas');
    out.width = sim.w * scale;
    out.height = sim.h * scale;
    const o = out.getContext('2d');
    if (!o) return;
    o.imageSmoothingEnabled = false;
    o.drawImage(canvas, 0, 0, out.width, out.height);
    const download = (href: string) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = 'falling-sand-picture.png';
      document.body.append(a);
      a.click();
      a.remove();
    };
    if (typeof out.toBlob === 'function') {
      out.toBlob((blob) => {
        if (!blob) return say('Could not save the picture, sorry.');
        const url = URL.createObjectURL(blob);
        download(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        say('📷 Picture saved!');
      }, 'image/png');
    } else {
      download(out.toDataURL('image/png'));
    }
  }

  // ---------- reaction book (the shareable result) ----------
  const shareHost = $<HTMLElement>('[data-share]');
  shareHost.append(buildShareRow(share, shareScore));

  function renderBook(): void {
    $<HTMLElement>('[data-book-score]').textContent = `${allTime.size} / ${TOTAL}`;
    $<HTMLElement>('[data-book-sub]').textContent =
      allTime.size === TOTAL
        ? 'Every reaction found. You are a certified mad scientist.'
        : `reactions found so far (${session.size} this visit). Your record is saved in this browser.`;
    const list = $<HTMLElement>('[data-book-list]');
    list.replaceChildren(
      ...REACTIONS.map((r) => {
        const li = document.createElement('li');
        const got = allTime.has(r.id);
        li.className = got ? 'is-found' : '';
        li.textContent = got ? `✅ ${r.name}` : `❓ ${r.hint}`;
        return li;
      }),
    );
  }
  function openBook(): void {
    renderBook();
    book.hidden = false;
    bookBtn.setAttribute('aria-expanded', 'true');
    $<HTMLButtonElement>('[data-close]').focus({ preventScroll: true });
  }
  function closeBook(): void {
    book.hidden = true;
    bookBtn.setAttribute('aria-expanded', 'false');
    canvas.focus({ preventScroll: true });
  }
  bookBtn.addEventListener('click', () => (book.hidden ? openBook() : closeBook()));
  $<HTMLButtonElement>('[data-close]').addEventListener('click', closeBook);

  // ---------- loop ----------
  const running = () => !document.hidden && inView;

  function tick(now: number): void {
    raf = 0;
    if (!running()) return;
    acc += Math.min(100, now - last);
    last = now;
    if (drawing !== null && px >= 0) stroke(px, py, px, py, drawEl);
    let steps = 0;
    while (acc >= STEP_MS && steps < 2) {
      if (!paused) {
        sim.step();
        dirty = true;
      }
      acc -= STEP_MS;
      steps++;
    }
    if (steps === 2) acc = 0;
    if (dirty && image && buf) {
      frame++;
      sim.render(buf, frame);
      ctx.putImageData(image, 0, 0);
      dirty = false;
    }
    raf = requestAnimationFrame(tick);
  }
  function wake(): void {
    if (raf || !running()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  document.addEventListener('visibilitychange', wake);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      wake();
    }).observe(canvas);
  }
  new ResizeObserver(() => {
    resize();
    wake();
  }).observe(view);

  renderCount();
  setBrush(brush);
  resize();
  wake();
}
