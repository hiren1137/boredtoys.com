import { CATEGORIES, SITE } from '../config/site';
import { absUrl, gamePath, getGames } from '../lib/games';

export async function GET() {
  const games = await getGames();
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'All games are free, run entirely in the browser, and need no account. Scores are stored only on the player\'s device.',
    '',
    '## Games',
    '',
    ...games.map(
      (g) =>
        `- [${g.data.title}](${absUrl(gamePath(g.data.slug))}): ${g.data.shortDescription} (${CATEGORIES[g.data.category].label})`,
    ),
    '',
    '## Pages',
    '',
    `- [All games](${absUrl('/')})`,
    `- [About](${absUrl('/about/')})`,
    `- [RSS feed](${absUrl('/rss.xml')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
