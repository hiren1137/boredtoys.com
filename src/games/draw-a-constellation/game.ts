import './game.css';
import { saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { CONSTELLATIONS, type Constellation } from './stars';

const SLUG = 'draw-a-constellation';
const ROUNDS = 5;

const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreOf(c: Constellation, drawn: Set<string>): number {
  const official = new Set(c.lines.map(([a, b]) => key(a, b)));
  let hit = 0;
  for (const line of drawn) if (official.has(line)) hit += 1;
  const denom = official.size + drawn.size;
  return denom ? Math.round((200 * hit) / denom) : 0;
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-sky';
  root.append(el);

  let round: Constellation[] = [];
  let i = 0;
  let scores: number[] = [];
  let drawn = new Set<string>();
  let from: number | null = null;

  function start(): void {
    round = shuffle(CONSTELLATIONS).slice(0, ROUNDS);
    i = 0;
    scores = [];
    play();
  }

  function play(): void {
    const c = round[i];
    drawn = new Set();
    from = null;
    el.innerHTML = `
      <div class="sky-play">
        <div class="sky-top"><span>${i + 1} / ${ROUNDS}</span><strong></strong><button type="button" class="btn btn--small btn--white" data-undo>Undo</button></div>
        <p>Connect the stars. Tap a star, then tap another.</p>
        <svg class="sky-svg" viewBox="0 0 100 100" role="img"></svg>
        <button type="button" class="btn btn--big btn--mint" data-done>That's my constellation</button>
      </div>`;
    (el.querySelector('.sky-top strong') as HTMLElement).textContent = c.name;
    const svg = el.querySelector('.sky-svg') as SVGSVGElement;
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.append(lines);
    c.stars.forEach((s, n) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(s.x));
      dot.setAttribute('cy', String(s.y));
      dot.setAttribute('r', String(1.6 + (4 - s.m)));
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', `Star ${n + 1}`);
      const tap = () => pick(n, lines, c);
      dot.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        tap();
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tap();
        }
      });
      svg.append(dot);
    });
    el.querySelector('[data-undo]')?.addEventListener('click', () => {
      const last = [...drawn].pop();
      if (!last) return;
      drawn.delete(last);
      paint(lines);
    });
    el.querySelector('[data-done]')?.addEventListener('click', () => {
      scores.push(scoreOf(c, drawn));
      reveal(c, lines);
    });
  }

  function pick(n: number, lines: SVGGElement, _c: Constellation): void {
    if (from == null) {
      from = n;
      return;
    }
    if (from !== n) drawn.add(key(from, n));
    from = null;
    paint(lines);
  }

  function paint(lines: SVGGElement): void {
    lines.replaceChildren();
    const c = round[i];
    for (const line of drawn) {
      const [a, b] = line.split('-').map(Number);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      p.setAttribute('x1', String(c.stars[a].x));
      p.setAttribute('y1', String(c.stars[a].y));
      p.setAttribute('x2', String(c.stars[b].x));
      p.setAttribute('y2', String(c.stars[b].y));
      lines.append(p);
    }
  }

  function reveal(c: Constellation, lines: SVGGElement): void {
    lines.replaceChildren();
    const official = new Set(c.lines.map(([a, b]) => key(a, b)));
    const all = new Set([...official, ...drawn]);
    for (const line of all) {
      const [a, b] = line.split('-').map(Number);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      p.setAttribute('x1', String(c.stars[a].x));
      p.setAttribute('y1', String(c.stars[a].y));
      p.setAttribute('x2', String(c.stars[b].x));
      p.setAttribute('y2', String(c.stars[b].y));
      p.classList.add(official.has(line) && drawn.has(line) ? 'is-hit' : official.has(line) ? 'is-miss' : 'is-extra');
      lines.append(p);
    }
    const btn = el.querySelector('[data-done]') as HTMLButtonElement;
    btn.textContent = i + 1 >= ROUNDS ? 'See my sky' : 'Next sky';
    btn.replaceWith(btn.cloneNode(true));
    el.querySelector('[data-done]')?.addEventListener('click', () => {
      i += 1;
      if (i >= ROUNDS) finish();
      else play();
    });
  }

  function finish(): void {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const { best, isNewBest } = saveBest(SLUG, avg);
    el.replaceChildren(
      createResultPanel(root, {
        label: 'Average match',
        score: `${avg}%`,
        best: `${best}%`,
        isNewBest,
        message: 'Green lines matched the usual figure. Gold lines were extra. Dim lines were the ones you missed.',
        onPlayAgain: start,
      }),
    );
  }

  el.innerHTML = `<div class="sky-start"><p class="sky-big">Connect the stars.</p><p>${ROUNDS} real constellations, drawn as simple maps. Link the stars, then see the usual figure.</p><button type="button" class="btn btn--big btn--mint" data-start>Look up</button></div>`;
  el.querySelector('[data-start]')?.addEventListener('click', start);
}
