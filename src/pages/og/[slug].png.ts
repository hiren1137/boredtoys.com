import type { APIRoute, GetStaticPaths } from 'astro';
import { CATEGORIES, CATEGORY_KEYS, SITE, SITE_NAME } from '../../config/site';
import { gameColor, gamesByCategory, getGames } from '../../lib/games';
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
  const byCategory = gamesByCategory(games);
  for (const key of CATEGORY_KEYS) {
    const cat = CATEGORIES[key];
    const count = byCategory[key].length;
    paths.push({
      params: { slug: `category-${key}` },
      props: {
        title: cat.h1,
        subtitle: cat.intro[0].split('. ')[0] + '.',
        label: count === 1 ? '1 game' : `${count} games`,
        color: cat.color,
      },
    });
  }
  const pages: [slug: string, title: string, subtitle: string, color: string][] = [
    ['about', `About ${SITE_NAME}`, 'A growing box of tiny, silly browser games. Free, no sign-up.', 'var(--sky)'],
    ['contact', `Contact ${SITE_NAME}`, 'Report a bug, suggest a silly game or say hello.', 'var(--mint)'],
    ['privacy-policy', 'Privacy Policy', 'No accounts, no sign-ups. Your scores stay in your own browser.', 'var(--grape)'],
    ['advertise', `Advertise on ${SITE_NAME}`, 'Simple, clearly labeled sponsor spots on free silly games.', 'var(--tangerine)'],
  ];
  for (const [slug, title, subtitle, color] of pages) {
    paths.push({ params: { slug }, props: { title, subtitle, label: SITE_NAME, color } });
  }
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as OgInput);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
