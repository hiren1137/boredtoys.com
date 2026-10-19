import './game.css';
import { getJSON, setJSON } from '../../lib/storage';
import { createResultPanel } from '../../lib/result-panel';
import {
  BREATH_HIGH,
  BREATH_LOW,
  HEART_HIGH,
  HEART_LOW,
  ORBIT_KM_PER_S,
  POP_LAST_ESTIMATE_YEAR,
  SYNODIC_DAYS,
  worldPopulation,
} from './data';

const STORE_KEY = 'life-stats:birth';
const MIN_DATE = '1900-01-01';
const DAY_MS = 86_400_000;
const KM_PER_MILE = 1.609344;
const HEART_MID = (HEART_LOW + HEART_HIGH) / 2;
const BREATH_MID = (BREATH_LOW + BREATH_HIGH) / 2;

interface Ymd {
  y: number;
  m: number;
  d: number;
}

const fmt = (n: number) => Math.floor(n).toLocaleString('en-US');
const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
const pad = (n: number) => String(n).padStart(2, '0');
const isoOf = (t: Ymd) => `${t.y}-${pad(t.m)}-${pad(t.d)}`;
const ymdOf = (d: Date): Ymd => ({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });
const dayNumber = (t: Ymd) => Math.floor(Date.UTC(t.y, t.m - 1, t.d) / DAY_MS);
const localDate = (t: Ymd) => {
  const d = new Date(2000, t.m - 1, t.d);
  d.setFullYear(t.y);
  return d;
};
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const longDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function parseIso(s: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const t = { y: +m[1], m: +m[2], d: +m[3] };
  if (t.m < 1 || t.m > 12 || t.d < 1 || t.d > daysInMonth(t.y, t.m)) return null;
  return t;
}

/** Whole years, months and days between two calendar dates. */
function calendarAge(b: Ymd, t: Ymd): { years: number; months: number; days: number } {
  let years = t.y - b.y;
  let months = t.m - b.m;
  let days = t.d - b.d;
  if (days < 0) {
    months -= 1;
    const pm = t.m === 1 ? 12 : t.m - 1;
    const py = t.m === 1 ? t.y - 1 : t.y;
    days += daysInMonth(py, pm);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/** The birthday in a given year. Feb 29 birthdays fall on Mar 1 in common years. */
const birthdayIn = (b: Ymd, year: number) => ymdOf(new Date(year, b.m - 1, b.d));

function leapDaysLived(b: Ymd, t: Ymd): number {
  const from = dayNumber(b);
  const to = dayNumber(t);
  let n = 0;
  for (let y = b.y; y <= t.y; y++) {
    if (!isLeap(y)) continue;
    const day = dayNumber({ y, m: 2, d: 29 });
    if (day >= from && day <= to) n++;
  }
  return n;
}

interface Milestone {
  label: string;
  at: Date;
}

function milestones(b: Ymd): Milestone[] {
  const birthMs = localDate(b).getTime();
  const plusDays = (n: number) => {
    const d = localDate(b);
    d.setDate(d.getDate() + n);
    return d;
  };
  const list: Milestone[] = [];
  for (const n of [1000, 5000, 10000, 15000, 20000, 25000, 30000]) list.push({ label: `${fmt(n)} days old`, at: plusDays(n) });
  for (const n of [1000, 2000, 3000, 4000]) list.push({ label: `${fmt(n)} weeks old`, at: plusDays(n * 7) });
  for (const n of [100000, 250000, 500000]) list.push({ label: `${fmt(n)} hours old`, at: new Date(birthMs + n * 3_600_000) });
  for (const n of [10, 20, 30]) list.push({ label: `${n} million minutes old`, at: new Date(birthMs + n * 1e6 * 60_000) });
  for (const n of [1, 2, 3]) list.push({ label: `${n} billion seconds old`, at: new Date(birthMs + n * 1e9 * 1000) });
  return list.sort((a, b2) => a.at.getTime() - b2.at.getTime());
}

export function mount(root: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'g-life';
  root.append(el);

  let timer: number | undefined;

  const stopTimer = () => {
    if (timer != null) window.clearInterval(timer);
    timer = undefined;
  };

  function renderStart(errorMsg = ''): void {
    stopTimer();
    el.dataset.state = 'start';
    const saved = getJSON<string | null>(STORE_KEY, null);
    const today = isoOf(ymdOf(new Date()));
    el.innerHTML = `
      <form class="ls-start" novalidate>
        <p class="ls-kicker">Your life, in numbers</p>
        <p class="ls-big">When is your birthday?</p>
        <p class="ls-sub">Pick your birth date and see how many days, moons and laps around the Sun you have racked up so far.</p>
        <label class="ls-label" for="ls-date">Birth date</label>
        <input class="ls-date" id="ls-date" name="birth" type="date" min="${MIN_DATE}" max="${today}" required value="${saved && parseIso(saved) ? saved : ''}" />
        <label class="ls-check"><input type="checkbox" name="remember" ${saved ? 'checked' : ''} /> Remember my birth date on this device</label>
        <p class="ls-error" role="alert">${errorMsg}</p>
        <div class="ls-actions">
          <button type="submit" class="btn btn--big btn--mint">🎂 Show my life stats</button>
          ${saved ? '<button type="button" class="btn btn--white" data-forget>🧽 Forget me</button>' : ''}
        </div>
        <p class="ls-privacy">Your date never leaves this browser. Nothing is sent anywhere.</p>
      </form>`;
    const form = el.querySelector('form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = (form.elements.namedItem('birth') as HTMLInputElement).value;
      const remember = (form.elements.namedItem('remember') as HTMLInputElement).checked;
      const b = parseIso(value);
      if (!b) return renderStart('Please pick a full date: day, month and year.');
      const now = ymdOf(new Date());
      if (dayNumber(b) > dayNumber(now)) return renderStart('That date is in the future. Time travelers, please use a past date.');
      if (value < MIN_DATE) return renderStart('Please pick a date from 1900 onward.');
      setJSON(STORE_KEY, remember ? value : null);
      renderStats(b);
    });
    el.querySelector('[data-forget]')?.addEventListener('click', () => {
      setJSON(STORE_KEY, null);
      renderStart();
      (el.querySelector('.ls-date') as HTMLInputElement | null)?.focus();
    });
  }

  function renderStats(b: Ymd): void {
    stopTimer();
    el.dataset.state = 'stats';
    const birth = localDate(b);
    const birthMs = birth.getTime();
    const now = new Date();
    const t = ymdOf(now);
    const days = dayNumber(t) - dayNumber(b);
    const age = calendarAge(b, t);

    let next = birthdayIn(b, t.y);
    if (dayNumber(next) < dayNumber(t)) next = birthdayIn(b, t.y + 1);
    const prev = dayNumber(next) === dayNumber(t) ? next : birthdayIn(b, next.y - 1);
    const toNext = dayNumber(next) - dayNumber(t);
    const lapSpan = dayNumber(next) - dayNumber(prev) || 365;
    const lapPct = toNext === 0 ? 0 : Math.round(((dayNumber(t) - dayNumber(prev)) / lapSpan) * 100);

    const moons = Math.floor(days / SYNODIC_DAYS);
    const leaps = leapDaysLived(b, t);
    const popBorn = worldPopulation(b.y);
    const popNow = worldPopulation(t.y);

    const all = milestones(b);
    const upcoming = all.filter((m) => m.at.getTime() > now.getTime());
    const passed = all.filter((m) => m.at.getTime() <= now.getTime());
    const nextMs = upcoming[0];
    const daysUntil = (d: Date) => dayNumber(ymdOf(d)) - dayNumber(t);

    const message = nextMs
      ? `You will be ${nextMs.label} on ${shortDate(nextMs.at)}, ${daysUntil(nextMs.at) <= 0 ? 'which is today!' : `in ${plural(daysUntil(nextMs.at), 'day')}.`}`
      : 'You have passed every milestone on our list. Legend.';

    const panel = createResultPanel(root, {
      label: 'You have been alive for',
      score: plural(days, 'day'),
      message,
      playAgainLabel: '📅 Try another date',
      onPlayAgain: () => renderStart(),
      autoFocus: false,
    });

    const wrap = document.createElement('div');
    wrap.className = 'ls-stats';
    wrap.innerHTML = `
      <p class="ls-born">Born on <strong>${longDate(birth)}</strong></p>
      <div class="ls-grid">
        <section class="ls-card ls-card--sky">
          <h3><span aria-hidden="true">⏱️</span> Time alive</h3>
          <p class="ls-value">${plural(age.years, 'year')}, ${plural(age.months, 'month')}, ${plural(age.days, 'day')}</p>
          <ul class="ls-list">
            <li><strong>${fmt(days / 7)}</strong> weeks</li>
            <li><strong data-live="hours">0</strong> hours</li>
            <li><strong data-live="minutes">0</strong> minutes</li>
            <li><strong data-live="seconds">0</strong> seconds and counting</li>
          </ul>
          <p class="ls-note">Counted from midnight on the day you were born, in your device's time zone.</p>
        </section>
        <section class="ls-card ls-card--sunshine">
          <h3><span aria-hidden="true">☀️</span> Laps around the Sun</h3>
          <p class="ls-value">${plural(age.years, 'lap')} done</p>
          <div class="ls-bar" role="img" aria-label="${lapPct}% of the way to your next birthday"><span style="width:${lapPct}%"></span></div>
          <p>${toNext === 0 ? 'Happy birthday! A brand-new lap starts today. 🎉' : `You are ${lapPct}% of the way through lap ${fmt(age.years + 1)}. Your next birthday is in <strong>${plural(toNext, 'day')}</strong>.`}</p>
        </section>
        <section class="ls-card ls-card--mint">
          <h3><span aria-hidden="true">🌍</span> Distance traveled around the Sun</h3>
          <p class="ls-value"><span data-live="km">0</span> km</p>
          <p>That is about <strong data-live="miles">0</strong> miles. Earth zooms along its orbit at about ${ORBIT_KM_PER_S} km every second, so this number never sits still.</p>
          <p class="ls-note">Estimate based on Earth's average orbital speed.</p>
        </section>
        <section class="ls-card ls-card--grape">
          <h3><span aria-hidden="true">🌕</span> Full moons</h3>
          <p class="ls-value">About ${fmt(moons)}</p>
          <p>The Moon goes from full to full again about every ${SYNODIC_DAYS.toFixed(2)} days, so that is roughly how many full moons have risen since you arrived.</p>
        </section>
        <section class="ls-card ls-card--tomato">
          <h3><span aria-hidden="true">❤️</span> Heartbeats</h3>
          <p class="ls-value">About <span data-live="beats">0</span></p>
          <p>Rough estimate at ${HEART_MID} beats per minute. A resting adult heart usually beats ${HEART_LOW} to ${HEART_HIGH} times a minute, so your real total could be anywhere from about <strong>${fmt(minutesAlive(birthMs) * HEART_LOW)}</strong> to <strong>${fmt(minutesAlive(birthMs) * HEART_HIGH)}</strong>.</p>
          <p class="ls-note">Estimate only. Kids' hearts beat faster, and exercise speeds everyone up.</p>
        </section>
        <section class="ls-card ls-card--bubblegum">
          <h3><span aria-hidden="true">🌬️</span> Breaths</h3>
          <p class="ls-value">About <span data-live="breaths">0</span></p>
          <p>Rough estimate at ${BREATH_MID} breaths per minute, the middle of the ${BREATH_LOW} to ${BREATH_HIGH} a resting adult usually takes.</p>
          <p class="ls-note">Estimate only. Babies and kids breathe faster.</p>
        </section>
        <section class="ls-card ls-card--tangerine">
          <h3><span aria-hidden="true">📅</span> Calendar oddities</h3>
          <ul class="ls-list">
            <li>You were born on a <strong>${birth.toLocaleDateString('en-US', { weekday: 'long' })}</strong>.</li>
            <li>You have lived through <strong>${plural(leaps, 'leap day')}</strong> (February 29).</li>
            <li>You have lived through <strong>${plural(saturdaysLived(b, t), 'Saturday')}</strong>.</li>
            ${b.m === 2 && b.d === 29 ? '<li>Leap-day baby! In years without a February 29, we count your birthday on March 1.</li>' : ''}
          </ul>
        </section>
        ${
          popBorn != null && popNow != null
            ? `<section class="ls-card ls-card--sky">
          <h3><span aria-hidden="true">👥</span> People on Earth</h3>
          <p class="ls-value">${(popBorn / 1000).toFixed(2)} → ${(popNow / 1000).toFixed(2)} billion</p>
          <p>In the middle of ${b.y}, about <strong>${(popBorn / 1000).toFixed(2)} billion</strong> people lived on Earth${b.y > POP_LAST_ESTIMATE_YEAR ? ' (UN projection)' : ''}. For the middle of ${t.y}, the UN ${t.y > POP_LAST_ESTIMATE_YEAR ? 'projects' : 'estimates'} about <strong>${(popNow / 1000).toFixed(2)} billion</strong>.</p>
          ${popNow > popBorn ? `<p class="ls-note">That is roughly ${popDiff(popNow - popBorn)} more people than in your birth year.</p>` : ''}
        </section>`
            : ''
        }
      </div>
      <section class="ls-milestones">
        <h3><span aria-hidden="true">🏁</span> Life milestones</h3>
        <ol class="ls-ms">
          ${[...passed.slice(-4), ...upcoming.slice(0, 6)]
            .map((m) => {
              const dd = daysUntil(m.at);
              const status = m.at.getTime() <= now.getTime() ? (dd === 0 ? 'today!' : 'done ✔') : `in ${plural(dd, 'day')}`;
              const cls = m === nextMs ? ' is-next' : m.at.getTime() <= now.getTime() ? ' is-done' : '';
              return `<li class="ls-m${cls}"><span class="ls-m-what">${m.label}</span><span class="ls-m-when">${shortDate(m.at)}</span><span class="ls-m-status">${status}</span></li>`;
            })
            .join('')}
        </ol>
      </section>
      <details class="ls-sources">
        <summary>Sources and how we count</summary>
        <ul>
          <li>Days, weeks, hours, minutes, seconds, birthdays, leap days and milestones are exact calendar math, counted from midnight on your birth date.</li>
          <li>Full moons: NASA Moon Fact Sheet (synodic period of 29.53 days).</li>
          <li>Distance around the Sun: NASA Earth Fact Sheet (mean orbital speed of 29.78 km/s, about 940 million km per year).</li>
          <li>Heartbeats and breaths: Johns Hopkins Medicine, "Vital Signs" (resting adult pulse 60–100 beats per minute, breathing 12–16 breaths per minute). These are rough estimates.</li>
          <li>World population: United Nations, World Population Prospects 2024 (mid-year estimates to 2023, medium-variant projections after), via Our World in Data. Shown for birth years from 1950.</li>
        </ul>
      </details>`;

    el.replaceChildren(panel, wrap);

    const live = (key: string) => wrap.querySelector<HTMLElement>(`[data-live="${key}"]`);
    const out = {
      hours: live('hours'),
      minutes: live('minutes'),
      seconds: live('seconds'),
      km: live('km'),
      miles: live('miles'),
      beats: live('beats'),
      breaths: live('breaths'),
    };
    const tick = () => {
      if (!el.isConnected) return stopTimer();
      const secs = Math.max(0, (Date.now() - birthMs) / 1000);
      const km = secs * ORBIT_KM_PER_S;
      if (out.hours) out.hours.textContent = fmt(secs / 3600);
      if (out.minutes) out.minutes.textContent = fmt(secs / 60);
      if (out.seconds) out.seconds.textContent = fmt(secs);
      if (out.km) out.km.textContent = fmt(km);
      if (out.miles) out.miles.textContent = fmt(km / KM_PER_MILE);
      if (out.beats) out.beats.textContent = fmt((secs / 60) * HEART_MID);
      if (out.breaths) out.breaths.textContent = fmt((secs / 60) * BREATH_MID);
    };
    tick();
    timer = window.setInterval(tick, 1000);
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
    root.scrollIntoView?.({ block: 'start' });
  }

  renderStart();
}

function popDiff(millions: number): string {
  return millions >= 1000 ? `${(millions / 1000).toFixed(2)} billion` : `${fmt(millions)} million`;
}

function saturdaysLived(b: Ymd, t: Ymd): number {
  const from = dayNumber(b);
  const to = dayNumber(t);
  const first = from + ((6 - localDate(b).getDay() + 7) % 7);
  return first > to ? 0 : Math.floor((to - first) / 7) + 1;
}

function minutesAlive(birthMs: number): number {
  return Math.max(0, (Date.now() - birthMs) / 60_000);
}
