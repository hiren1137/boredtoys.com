import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config/site';
import { absUrl, gamePath, getGames } from '../lib/games';

export async function GET(context: APIContext) {
  const games = await getGames();
  return rss({
    title: `${SITE.name}: New Games`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: games.map((g) => ({
      title: g.data.title,
      description: g.data.metaDescription,
      link: absUrl(gamePath(g.data.slug)),
      pubDate: g.data.publishedAt,
      categories: [g.data.category, ...g.data.tags],
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}
