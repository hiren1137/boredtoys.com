import type { APIRoute, GetStaticPaths } from 'astro';
import { CATEGORIES, SITE } from '../../config/site';
import { gameColor, getGames } from '../../lib/games';
import { renderOg, type OgInput } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const games = await getGames();
  const paths: { params: { slug: string }; props: OgInput }[] = games.map((g) => ({
    params: { slug: g.data.slug },
    props: {
      title: g.data.title,
      subtitle: g.data.shortDescription,
      label: `${CATEGORIES[g.data.category].label} game`,
      color: gameColor(g),
      thumb: `thumbs/${g.data.slug}.svg`,
    },
  }));
  paths.push({
    params: { slug: 'default' },
    props: {
      title: 'Fun Games to Play When Bored',
      subtitle: `${SITE.tagline}. Free, no sign-up.`,
      label: `${games.length} silly games`,
      color: 'var(--sunshine)',
    },
  });
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as OgInput);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
