import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, NEW_BADGE_DAYS, RELEASE_TIMEZONE, SITE, type Category } from '../config/site';

export type Game = CollectionEntry<'games'>;

/** Today's date (YYYY-MM-DD) in the release timezone. */
export function releaseDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: RELEASE_TIMEZONE }).format(now);
}

/**
 * A game is live once its publishedAt date has arrived in RELEASE_TIMEZONE.
 * Scheduled games are left out of every page, the sitemap, RSS and llms.txt until then.
 * `npm run dev` and SHOW_SCHEDULED=1 builds include them so they can be previewed.
 */
export const isReleased = (g: Game, now = new Date()) =>
  g.data.publishedAt.toISOString().slice(0, 10) <= releaseDay(now);

const showScheduled = import.meta.env.DEV || process.env.SHOW_SCHEDULED === '1';

export async function getGames(): Promise<Game[]> {
  const games = (await getCollection('games')).filter((g) => showScheduled || isReleased(g));
  return games.sort(
    (a, b) =>
      b.data.publishedAt.getTime() - a.data.publishedAt.getTime() || a.data.title.localeCompare(b.data.title),
  );
}

export const gamePath = (slug: string) => `/${slug}/`;
export const categoryPath = (cat: Category) => `/category/${cat}/`;
export const absUrl = (path: string) => new URL(path, SITE.url).href;

export const gameColor = (g: Game) => g.data.color ?? CATEGORIES[g.data.category].color;

/** Stable tilt between -2 and 2 degrees derived from the slug. */
export function tiltFor(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unit = ((h >>> 0) % 1000) / 999;
  return Math.round((unit * 4 - 2) * 10) / 10;
}

export function isNew(g: Game, now = new Date()): boolean {
  const age = now.getTime() - g.data.publishedAt.getTime();
  // Allow a day of slack: publish dates are midnight UTC and builds can run in any timezone.
  return age >= -86400000 && age <= NEW_BADGE_DAYS * 86400000;
}

export function relatedGames(current: Game, all: Game[], count = 4): Game[] {
  const others = all.filter((g) => g.data.slug !== current.data.slug);
  const picked: Game[] = [];
  for (const slug of current.data.related) {
    const g = others.find((o) => o.data.slug === slug);
    if (g && !picked.includes(g)) picked.push(g);
  }
  const tags = new Set(current.data.tags);
  const scored = others
    .filter((g) => !picked.includes(g))
    .map((g) => ({
      g,
      score:
        g.data.tags.filter((t) => tags.has(t)).length + (g.data.category === current.data.category ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.g.data.publishedAt.getTime() - a.g.data.publishedAt.getTime());
  for (const { g } of scored) {
    if (picked.length >= count) break;
    picked.push(g);
  }
  return picked.slice(0, count);
}

export function gamesByCategory(all: Game[]): Record<Category, Game[]> {
  const out = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, [] as Game[]])) as Record<
    Category,
    Game[]
  >;
  for (const g of all) out[g.data.category].push(g);
  return out;
}

export const fullTitle = (t: string) => `${t} | ${SITE.name}`;
