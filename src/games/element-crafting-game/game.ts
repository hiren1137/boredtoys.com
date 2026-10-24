import './game.css';
import { getJSON, setJSON, saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { ITEMS, STARTERS, TOTAL_ITEMS, combine } from './recipes';

const SLUG = 'element-crafting-game';
const FOUND_KEY = `${SLUG}:found`;
const BOARD_KEY = `${SLUG}:board`;
const MAX_ON_BOARD = 60;
const DRAG_START_PX = 6;

/** A chip on the board. x and y are the chip's center as fractions of the board size. */
interface Placed {
  name: string;
  x: number;
  y: number;
}

interface Drag {
  chip: HTMLElement;
  name: string;
  fromBoard: Placed | null;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  started: boolean;
}

const NOTHING = [
  'Nothing happened. They just stared at each other.',
  'No luck. Those two are not friends yet.',
  'Hmm, nothing. Try a different pair.',
  'The universe shrugged. 🤷',
  'Nope. Not even a sparkle.',
  'Those two refuse to mix. Rude.',
];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const label = (name: string) => `${ITEMS.get(name)?.emoji ?? '❔'} ${name}`;

function loadFound(): string[] {
  const saved = getJSON<unknown>(FOUND_KEY, []);
  const list = Array.isArray(saved) ? saved.filter((n): n is string => typeof n === 'string' && ITEMS.has(n)) : [];
  const out = [...STARTERS];
  for (const n of list) if (!out.includes(n)) out.push(n);
  return out;
}

function loadBoard(): Placed[] {
  const saved = getJSON<unknown>(BOARD_KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter(
      (p): p is Placed =>
        !!p && typeof p.name === 'string' && ITEMS.has(p.name) && Number.isFinite(p.x) && Number.isFinite(p.y),
    )
    .slice(-MAX_ON_BOARD)
    .map((p) => ({ name: p.name, x: clamp01(p.x), y: clamp01(p.y) }));
}

const clamp01 = (n: number) => Math.min(0.97, Math.max(0.03, n));

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-craft';
  el.innerHTML = `
    <div class="gc-board" data-board>
      <div class="gc-top">
        <p class="gc-progress" data-progress></p>
        <div class="gc-tools">
          <button type="button" class="btn btn--small btn--sky" data-share>📤 Share</button>
          <button type="button" class="btn btn--small btn--white" data-clear>🧹 Clear</button>
        </div>
      </div>
      <p class="gc-empty" data-empty>Drag elements here, then drop one on top of another to combine them.</p>
      <p class="gc-toast" data-toast aria-hidden="true"></p>
      <p class="gc-select" data-select hidden></p>
    </div>
    <aside class="gc-side" aria-label="Your items">
      <div class="gc-filters" data-filters hidden>
        <label class="visually-hidden" for="gc-search">Search your items</label>
        <input id="gc-search" class="gc-search" type="search" placeholder="🔎 Search" autocomplete="off" data-search />
        <label class="visually-hidden" for="gc-sort">Sort items</label>
        <select id="gc-sort" class="gc-sort" data-sort>
          <option value="found">Oldest</option>
          <option value="az">A to Z</option>
        </select>
      </div>
      <div class="gc-list" data-list role="list"></div>
      <div class="gc-foot">
        <span class="gc-tip">Tap or drag an item onto the board</span>
        <button type="button" class="gc-reset" data-reset>Reset</button>
      </div>
    </aside>
    <div class="gc-drag" data-drag></div>
    <div class="gc-overlay" data-overlay hidden></div>
    <p class="visually-hidden" role="status" aria-live="polite" data-live></p>`;
  root.append(el);

  const q = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
  const board = q<HTMLElement>('[data-board]');
  const list = q<HTMLElement>('[data-list]');
  const dragLayer = q<HTMLElement>('[data-drag]');
  const progress = q<HTMLElement>('[data-progress]');
  const empty = q<HTMLElement>('[data-empty]');
  const toast = q<HTMLElement>('[data-toast]');
  const selectHint = q<HTMLElement>('[data-select]');
  const filters = q<HTMLElement>('[data-filters]');
  const search = q<HTMLInputElement>('[data-search]');
  const sort = q<HTMLSelectElement>('[data-sort]');
  const live = q<HTMLElement>('[data-live]');
  const overlay = q<HTMLElement>('[data-overlay]');
  const resetBtn = q<HTMLButtonElement>('[data-reset]');

  let found = loadFound();
  let placed = loadBoard();
  let selected: string | null = null;
  let drag: Drag | null = null;
  let suppressClick = false;
  let toastTimer = 0;
  let resetTimer = 0;
  const chips = new Map<Placed, HTMLElement>();

  const save = () => {
    setJSON(FOUND_KEY, found);
    setJSON(BOARD_KEY, placed);
  };

  function say(text: string, kind: 'good' | 'new' | 'meh' = 'good'): void {
    live.textContent = text;
    toast.textContent = text;
    toast.dataset.kind = kind;
    toast.classList.remove('is-on');
    void toast.offsetWidth;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
  }

  function renderProgress(): void {
    progress.innerHTML = `Found <b>${found.length}</b> of ${TOTAL_ITEMS}`;
    filters.hidden = found.length < 10;
  }

  function renderList(): void {
    const term = search.value.trim().toLowerCase();
    let names = sort.value === 'az' ? [...found].sort((a, b) => a.localeCompare(b)) : found;
    if (term) names = names.filter((n) => n.toLowerCase().includes(term));
    const frag = document.createDocumentFragment();
    for (const name of names) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gc-chip gc-item';
      b.dataset.name = name;
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-pressed', String(selected === name));
      b.innerHTML = `<span class="gc-emoji" aria-hidden="true"></span><span></span>`;
      b.firstElementChild!.textContent = ITEMS.get(name)!.emoji;
      b.lastElementChild!.textContent = name;
      frag.append(b);
    }
    if (!names.length) {
      const none = document.createElement('p');
      none.className = 'gc-none';
      none.textContent = 'No items match your search.';
      frag.append(none);
    }
    list.replaceChildren(frag);
  }

  function makeChip(name: string): HTMLElement {
    const c = document.createElement('div');
    c.className = 'gc-chip gc-placed';
    c.dataset.name = name;
    c.innerHTML = `<span class="gc-emoji" aria-hidden="true"></span><span></span>`;
    c.firstElementChild!.textContent = ITEMS.get(name)!.emoji;
    c.lastElementChild!.textContent = name;
    return c;
  }

  function positionChip(chip: HTMLElement, p: Placed): void {
    chip.style.left = `${p.x * 100}%`;
    chip.style.top = `${p.y * 100}%`;
  }

  function addToBoard(p: Placed, pop = false): HTMLElement {
    placed.push(p);
    while (placed.length > MAX_ON_BOARD) removeFromBoard(placed[0]);
    const chip = makeChip(p.name);
    positionChip(chip, p);
    if (pop) chip.classList.add('is-pop');
    board.append(chip);
    chips.set(p, chip);
    empty.hidden = true;
    return chip;
  }

  function removeFromBoard(p: Placed): void {
    chips.get(p)?.remove();
    chips.delete(p);
    placed = placed.filter((o) => o !== p);
    empty.hidden = placed.length > 0;
  }

  function renderBoard(): void {
    for (const c of chips.values()) c.remove();
    chips.clear();
    const keep = placed;
    placed = [];
    for (const p of keep) addToBoard(p);
    empty.hidden = placed.length > 0;
  }

  /** Records a result. Returns true when it is a brand new discovery. */
  function discover(name: string): boolean {
    if (found.includes(name)) return false;
    found.push(name);
    saveBest(SLUG, found.length);
    renderProgress();
    renderList();
    return true;
  }

  function tryCombine(a: string, b: string, at: { x: number; y: number }): string | null {
    const result = combine(a, b);
    if (!result) return null;
    const isNew = discover(result);
    addToBoard({ name: result, x: clamp01(at.x), y: clamp01(at.y) }, true);
    if (isNew) say(`New discovery! ${label(result)}`, 'new');
    else say(`${label(a)} + ${label(b)} = ${label(result)}`);
    save();
    return result;
  }

  function spawnSpot(): { x: number; y: number } {
    for (let tries = 0; tries < 12; tries++) {
      const x = 0.18 + Math.random() * 0.64;
      const y = 0.26 + Math.random() * 0.56;
      if (!placed.some((p) => Math.abs(p.x - x) < 0.12 && Math.abs(p.y - y) < 0.1)) return { x, y };
    }
    return { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.5 };
  }

  // ----- Selection for keyboard players: pick one item, then a second to combine them. -----
  function setSelected(name: string | null): void {
    selected = name;
    for (const b of list.querySelectorAll<HTMLElement>('.gc-item')) {
      b.setAttribute('aria-pressed', String(b.dataset.name === name));
    }
    selectHint.hidden = !name;
    if (name) {
      selectHint.textContent = `Picked ${label(name)}. Now pick a second item to combine. Esc cancels.`;
      live.textContent = `Picked ${name}. Pick a second item to combine with it.`;
    }
  }

  function keyboardPick(name: string): void {
    if (!selected) {
      setSelected(name);
      return;
    }
    const first = selected;
    setSelected(null);
    const spot = spawnSpot();
    if (!tryCombine(first, name, spot)) {
      say(`${first} + ${name}: ${pick(NOTHING)}`, 'meh');
    }
    list.querySelector<HTMLElement>(`.gc-item[data-name="${CSS.escape(name)}"]`)?.focus();
  }

  list.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('.gc-item');
    if (!item?.dataset.name) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    // detail is 0 for keyboard activation, so Enter and Space use the pick-two flow.
    if (e.detail === 0) {
      keyboardPick(item.dataset.name);
      return;
    }
    addToBoard({ name: item.dataset.name, ...spawnSpot() }, true);
    save();
  });

  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!overlay.hidden) closeOverlay();
      else if (selected) {
        setSelected(null);
        live.textContent = 'Selection cleared.';
      }
    }
  });

  // ----- Dragging, from the list or around the board. Pointer events cover mouse, pen and touch. -----
  function rootPoint(e: PointerEvent): { x: number; y: number } {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0 || drag) return;
    const target = e.target as HTMLElement;
    const chip = target.closest<HTMLElement>('.gc-chip');
    if (!chip?.dataset.name) return;
    const fromBoard = chip.classList.contains('gc-placed')
      ? ([...chips.entries()].find(([, c]) => c === chip)?.[0] ?? null)
      : null;
    const rect = chip.getBoundingClientRect();
    drag = {
      chip,
      name: chip.dataset.name,
      fromBoard,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - (rect.left + rect.width / 2),
      offsetY: e.clientY - (rect.top + rect.height / 2),
      started: false,
    };
    // The drag only starts after a small move, so taps, double-clicks and list scrolling still work.
    if (fromBoard) e.preventDefault();
  }

  function startDrag(e: PointerEvent): void {
    if (!drag) return;
    drag.started = true;
    if (drag.fromBoard) removeFromBoard(drag.fromBoard);
    drag.chip = makeChip(drag.name);
    drag.chip.classList.add('is-dragging');
    dragLayer.append(drag.chip);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    moveDrag(e);
  }

  function moveDrag(e: PointerEvent): void {
    if (!drag) return;
    const p = rootPoint(e);
    drag.chip.style.left = `${p.x - drag.offsetX}px`;
    drag.chip.style.top = `${p.y - drag.offsetY}px`;
    const hit = hitChip(e.clientX - drag.offsetX, e.clientY - drag.offsetY);
    for (const c of chips.values()) c.classList.toggle('is-target', c === hit);
  }

  /** The board chip under a point in viewport coordinates, if any. */
  function hitChip(cx: number, cy: number): HTMLElement | null {
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const c of chips.values()) {
      const r = c.getBoundingClientRect();
      if (cx < r.left - 10 || cx > r.right + 10 || cy < r.top - 10 || cy > r.bottom + 10) continue;
      const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_START_PX) return;
      startDrag(e);
    }
    e.preventDefault();
    moveDrag(e);
  }

  function endDrag(e: PointerEvent, cancelled: boolean): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    if (!d.started) return;
    suppressClick = !d.fromBoard;
    window.setTimeout(() => (suppressClick = false), 0);
    d.chip.remove();
    for (const c of chips.values()) c.classList.remove('is-target');

    const br = board.getBoundingClientRect();
    const cx = e.clientX - d.offsetX;
    const cy = e.clientY - d.offsetY;
    const onBoard = cx >= br.left && cx <= br.right && cy >= br.top && cy <= br.bottom;

    if (cancelled) {
      if (d.fromBoard) addToBoard(d.fromBoard);
      save();
      return;
    }
    if (!onBoard) {
      // Dropping a board item back on the list removes it.
      save();
      return;
    }
    const at = { x: clamp01((cx - br.left) / br.width), y: clamp01((cy - br.top) / br.height) };
    const hit = hitChip(cx, cy);
    const target = hit ? [...chips.entries()].find(([, c]) => c === hit)?.[0] : undefined;
    if (target) {
      const result = combine(d.name, target.name);
      if (result) {
        removeFromBoard(target);
        tryCombine(d.name, target.name, { x: target.x, y: target.y });
        return;
      }
      const dropped = addToBoard({ name: d.name, ...at });
      for (const c of [dropped, hit!]) {
        c.classList.remove('is-wobble');
        void c.offsetWidth;
        c.classList.add('is-wobble');
      }
      say(pick(NOTHING), 'meh');
      save();
      return;
    }
    addToBoard({ name: d.name, ...at });
    save();
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', (e) => endDrag(e, false));
  el.addEventListener('pointercancel', (e) => endDrag(e, true));

  // Double-click a board item to make a copy next to it.
  board.addEventListener('dblclick', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.gc-placed');
    const p = chip && [...chips.entries()].find(([, c]) => c === chip)?.[0];
    if (!p) return;
    addToBoard({ name: p.name, x: clamp01(p.x + 0.08), y: clamp01(p.y + 0.06) }, true);
    save();
  });

  // ----- Toolbar -----
  q<HTMLButtonElement>('[data-clear]').addEventListener('click', () => {
    for (const p of [...placed]) removeFromBoard(p);
    save();
    say('Board cleared. Your discoveries are safe.');
  });

  function closeOverlay(): void {
    overlay.hidden = true;
    overlay.replaceChildren();
    q<HTMLButtonElement>('[data-share]').focus({ preventScroll: true });
  }

  q<HTMLButtonElement>('[data-share]').addEventListener('click', () => {
    const { best, isNewBest } = saveBest(SLUG, found.length);
    const pct = Math.floor((found.length / TOTAL_ITEMS) * 100);
    const newest = found.length > STARTERS.length ? found[found.length - 1] : null;
    overlay.replaceChildren(
      createResultPanel(root, {
        label: 'Items discovered',
        score: `${found.length} / ${TOTAL_ITEMS}`,
        shareScore: String(found.length),
        message: newest
          ? `Newest find: ${label(newest)}. That is ${pct}% of the recipe book.`
          : 'Only the four starters so far. Go mix something!',
        best: String(best),
        isNewBest: isNewBest && found.length > STARTERS.length,
        playAgainLabel: '⚗️ Keep crafting',
        onPlayAgain: closeOverlay,
      }),
    );
    overlay.hidden = false;
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  resetBtn.addEventListener('click', () => {
    if (!resetBtn.classList.contains('is-armed')) {
      resetBtn.classList.add('is-armed');
      resetBtn.textContent = 'Really reset? Tap again';
      clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        resetBtn.classList.remove('is-armed');
        resetBtn.textContent = 'Reset';
      }, 3500);
      return;
    }
    clearTimeout(resetTimer);
    resetBtn.classList.remove('is-armed');
    resetBtn.textContent = 'Reset';
    found = [...STARTERS];
    for (const p of [...placed]) removeFromBoard(p);
    setSelected(null);
    save();
    renderProgress();
    renderList();
    say('Fresh start! Back to the four elements.');
  });

  search.addEventListener('input', renderList);
  sort.addEventListener('change', renderList);

  renderProgress();
  renderList();
  renderBoard();
}
