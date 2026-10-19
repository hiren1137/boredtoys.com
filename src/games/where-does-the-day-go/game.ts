import './game.css';
import { saveBest } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import { ACTIVITIES, DAY } from './data';

const SLUG = 'where-does-the-day-go';

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-day';
  root.append(el);
  const guess = ACTIVITIES.map(() => 0);

  function used() {
    return Math.round(guess.reduce((a, b) => a + b, 0) * 10) / 10;
  }

  function render(): void {
    const left = Math.round((DAY - used()) * 10) / 10;
    el.innerHTML = `
      <div class="day-play">
        <p class="day-left">${left} hours left to place</p>
        <div class="day-rows"></div>
        <button type="button" class="btn btn--big btn--mint" data-go ${left !== 0 ? 'disabled' : ''}>Show the real day</button>
      </div>`;
    const rows = el.querySelector('.day-rows') as HTMLElement;
    ACTIVITIES.forEach((a, i) => {
      const row = document.createElement('label');
      row.className = 'day-row';
      row.innerHTML = `<span></span><input type="range" min="0" max="14" step="0.1" value="${guess[i]}" aria-label="${a.name}"><b>${guess[i].toFixed(1)}h</b>`;
      (row.querySelector('span') as HTMLElement).textContent = a.name;
      const input = row.querySelector('input') as HTMLInputElement;
      input.addEventListener('input', () => {
        const next = Number(input.value);
        const others = used() - guess[i];
        guess[i] = Math.max(0, Math.min(next, Math.round((DAY - others) * 10) / 10));
        render();
      });
      rows.append(row);
    });
    el.querySelector('[data-go]')?.addEventListener('click', reveal);
  }

  function reveal(): void {
    const err = ACTIVITIES.reduce((s, a, i) => s + Math.abs(guess[i] - a.hours), 0) / 2;
    const score = Math.max(0, Math.round(100 - err * 8));
    const { best, isNewBest } = saveBest(SLUG, score);
    const list = document.createElement('ul');
    list.className = 'day-compare';
    ACTIVITIES.forEach((a, i) => {
      const li = document.createElement('li');
      li.textContent = `${a.name}: you ${guess[i].toFixed(1)}h, average ${a.hours.toFixed(2)}h`;
      list.append(li);
    });
    el.replaceChildren(
      createResultPanel(root, {
        label: 'How close you were',
        score: `${score}`,
        shareScore: `${score} out of 100`,
        best: String(best),
        isNewBest,
        message: 'Figures are 2023 U.S. averages for everyone age 15 and over, including people who skipped that activity.',
        extra: list,
        onPlayAgain: () => {
          guess.fill(0);
          render();
        },
      }),
    );
  }

  render();
}
