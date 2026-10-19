import './game.css';
import { saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { LOTS, usd, type Lot } from './items';

const SLUG = 'guess-the-price-game';
const ROUNDS = 10;
const PER = 1000;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 1000 points for an exact guess, 0 once you are off by 100 times. */
function pointsFor(guess: number, actual: number): number {
  const ratio = Math.abs(Math.log10(guess / actual));
  return Math.round(PER * Math.max(0, 1 - ratio / 2));
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-price';
  root.append(el);

  let round: Lot[] = [];
  let i = 0;
  let total = 0;
  let guess = 1_000_000;

  function start(): void {
    round = shuffle(LOTS).slice(0, ROUNDS);
    i = 0;
    total = 0;
    showLot();
  }

  function showLot(): void {
    const lot = round[i];
    guess = 1_000_000;
    el.innerHTML = `
      <div class="pr-play">
        <div class="pr-top"><span class="pr-pill">Lot ${i + 1} / ${ROUNDS}</span><span class="pr-pill">Score ${total.toLocaleString('en-US')}</span></div>
        <div class="pr-card" style="--swatch:${lot.swatch}">
          <div class="pr-art" aria-hidden="true"><span></span><b>${lot.year}</b></div>
          <h2 class="pr-name"></h2>
          <p class="pr-blurb"></p>
        </div>
        <label class="pr-lab">Your guess <output data-out></output></label>
        <input class="pr-range" type="range" min="0" max="1000" value="500" aria-label="Guess the sale price">
        <button type="button" class="btn btn--big btn--mint" data-bid>Place bid</button>
      </div>`;
    (el.querySelector('.pr-name') as HTMLElement).textContent = lot.name;
    (el.querySelector('.pr-blurb') as HTMLElement).textContent = lot.blurb;
    const range = el.querySelector('.pr-range') as HTMLInputElement;
    const out = el.querySelector('[data-out]') as HTMLElement;
    const paint = () => {
      const t = Number(range.value) / 1000;
      guess = Math.round(1000 * Math.pow(10, t * 6));
      out.textContent = usd(guess);
    };
    range.addEventListener('input', paint);
    paint();
    el.querySelector('[data-bid]')?.addEventListener('click', () => reveal(lot, guess));
  }

  function reveal(lot: Lot, bid: number): void {
    const pts = pointsFor(bid, lot.price);
    total += pts;
    el.innerHTML = `
      <div class="pr-play">
        <p class="pr-kicker">${pts.toLocaleString('en-US')} points</p>
        <p class="pr-big">${usd(lot.price)}</p>
        <p class="pr-note"></p>
        <p>You guessed ${usd(bid)}.</p>
        <button type="button" class="btn btn--big btn--mint" data-next>${i + 1 >= ROUNDS ? 'See my score' : 'Next lot'}</button>
      </div>`;
    (el.querySelector('.pr-note') as HTMLElement).textContent = `${lot.house}, ${lot.year}. ${lot.note}`;
    el.querySelector('[data-next]')?.addEventListener('click', () => {
      i += 1;
      if (i >= ROUNDS) finish();
      else showLot();
    });
  }

  function finish(): void {
    const { best, isNewBest } = saveBest(SLUG, total);
    el.replaceChildren(
      createResultPanel(root, {
        label: `Score out of ${(ROUNDS * PER).toLocaleString('en-US')}`,
        score: total.toLocaleString('en-US'),
        shareScore: `${total.toLocaleString('en-US')} out of ${(ROUNDS * PER).toLocaleString('en-US')}`,
        best: best.toLocaleString('en-US'),
        isNewBest,
        message: total > 7000 ? 'Auction-house instincts.' : total > 4000 ? 'In the right ballpark.' : 'The paddle got away from you.',
        onPlayAgain: start,
      }),
    );
  }

  el.innerHTML = `
    <div class="pr-start">
      <p class="pr-big">What did it sell for?</p>
      <p>${ROUNDS} famous lots. Guess the real sale price. Closer on the scale means more points.</p>
      <button type="button" class="btn btn--big btn--mint" data-start>Open the sale</button>
    </div>`;
  el.querySelector('[data-start]')?.addEventListener('click', start);
}
