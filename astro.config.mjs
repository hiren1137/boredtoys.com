import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, SPONSORS_ENABLED } from './src/config/site.ts';
import { readGames } from './scripts/lib/games.mjs';

const games = readGames();
const lastmodBySlug = new Map(
  games.map(({ data }) => [String(data.slug), new Date(data.updatedAt ?? data.publishedAt)]),
);
const categoryCounts = games.reduce((acc, { data }) => {
  acc[data.category] = (acc[data.category] ?? 0) + 1;
  return acc;
}, {});
const newest = games
  .map(({ data }) => new Date(data.updatedAt ?? data.publishedAt).getTime())
  .filter((t) => !Number.isNaN(t))
  .sort((a, b) => b - a)[0];

function isNoindex(pathname) {
  if (pathname.startsWith('/advertise/')) return !SPONSORS_ENABLED;
  const cat = pathname.match(/^\/category\/([^/]+)\/$/);
  if (cat) return (categoryCounts[cat[1]] ?? 0) < 2;
  return pathname === '/404/' || pathname === '/random/' || pathname.startsWith('/og/');
}

export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: false,
  integrations: [
    sitemap({
      filter: (page) => !isNoindex(new URL(page).pathname),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const slug = path.replace(/^\/|\/$/g, '');
        const lastmod = lastmodBySlug.get(slug);
        if (lastmod && !Number.isNaN(lastmod.getTime())) {
          item.lastmod = lastmod.toISOString();
        } else if (newest && (path === '/' || path.startsWith('/category/'))) {
          item.lastmod = new Date(newest).toISOString();
        }
        return item;
      },
    }),
  ],
});
