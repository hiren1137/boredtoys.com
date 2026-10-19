import type { Character } from './data';

export type Mood = 'happy' | 'calm' | 'annoyed' | 'angry';

const INK = '#1f1a2e';
const ST = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

const BODIES: Record<Character['body'], string> = {
  round: '<circle cx="80" cy="104" r="58"/>',
  tall: '<rect x="38" y="36" width="84" height="128" rx="40"/>',
  bean: '<path d="M44 92c0-36 16-58 40-58s36 22 36 50c0 20-6 30-6 46 0 22-14 34-36 34s-36-14-34-38c1-14 0-20 0-34z"/>',
  square: '<rect x="28" y="50" width="104" height="110" rx="26"/>',
};

const TOP: Record<Character['body'], number> = { round: 46, tall: 36, bean: 34, square: 50 };

function mouth(mood: Mood): string {
  switch (mood) {
    case 'happy':
      return `<path ${ST} d="M64 112c8 12 24 12 32 0" fill="#ff7466"/>`;
    case 'calm':
      return `<path ${ST} d="M66 114c6 5 22 5 28 0" fill="none"/>`;
    case 'annoyed':
      return `<path ${ST} d="M66 116h28" fill="none"/>`;
    default:
      return `<path ${ST} d="M64 120c8-10 24-10 32 0" fill="none"/>`;
  }
}

function brows(mood: Mood): string {
  if (mood === 'angry') return `<path ${ST} d="M54 74l16 6M106 74l-16 6" fill="none"/>`;
  if (mood === 'annoyed') return `<path ${ST} d="M54 78h14M92 78h14" fill="none"/>`;
  return '';
}

function extra(name: string, top: number): string {
  switch (name) {
    case 'glasses':
      return `<g ${ST} fill="none"><circle cx="62" cy="92" r="12"/><circle cx="98" cy="92" r="12"/><path d="M74 92h12"/></g>`;
    case 'shades':
      return `<g ${ST}><path d="M48 86h64v6c0 8-6 12-14 12s-12-6-14-12h-8c-2 6-6 12-14 12s-14-4-14-12z" fill="${INK}"/></g>`;
    case 'tophat':
      return `<g ${ST}><rect x="56" y="${top - 46}" width="48" height="44" rx="4" fill="${INK}"/><rect x="42" y="${top - 6}" width="76" height="10" rx="5" fill="${INK}"/><rect x="56" y="${top - 18}" width="48" height="8" fill="#ff7466"/></g>`;
    case 'cap':
      return `<g ${ST}><path d="M50 ${top + 10}c0-22 60-22 60 0z" fill="#ff7466"/><path d="M104 ${top + 8}h26" /></g>`;
    case 'beanie':
      return `<g ${ST}><path d="M48 ${top + 14}c0-30 64-30 64 0z" fill="#ffac57"/><circle cx="80" cy="${top - 12}" r="7" fill="#fffdf7"/></g>`;
    case 'bow':
      return `<g ${ST}><path d="M80 ${top + 2}l-20-12v24zM80 ${top + 2}l20-12v24z" fill="#ff7466"/><circle cx="80" cy="${top + 2}" r="5" fill="#ff7466"/></g>`;
    case 'mustache':
      return `<path ${ST} d="M80 104c-6-6-18-6-22 2 8 0 14 2 22-2zm0 0c6-6 18-6 22 2-8 0-14 2-22-2z" fill="${INK}"/>`;
    case 'antenna':
      return `<g ${ST}><path d="M70 ${top + 2}l-10-24M90 ${top + 2}l10-24" fill="none"/><circle cx="60" cy="${top - 24}" r="6" fill="#ffd447"/><circle cx="100" cy="${top - 24}" r="6" fill="#ffd447"/></g>`;
    case 'flower':
      return `<g ${ST} transform="translate(108 ${top + 10})"><circle cx="0" cy="-9" r="7" fill="#ffa3d1"/><circle cx="9" cy="0" r="7" fill="#ffa3d1"/><circle cx="0" cy="9" r="7" fill="#ffa3d1"/><circle cx="-9" cy="0" r="7" fill="#ffa3d1"/><circle r="5" fill="#ffd447"/></g>`;
    case 'crown':
      return `<path ${ST} d="M56 ${top + 4}l-2-26 14 12 12-18 12 18 14-12-2 26z" fill="#ffd447"/>`;
    case 'headphones':
      return `<g ${ST}><path d="M40 98c0-40 80-40 80 0" fill="none" stroke-width="7"/><rect x="30" y="88" width="16" height="26" rx="7" fill="#ff7466"/><rect x="114" y="88" width="16" height="26" rx="7" fill="#ff7466"/></g>`;
    default:
      return '';
  }
}

/** Builds a customer portrait from body shape, color, accessories and current mood. */
export function portrait(c: Character, mood: Mood): string {
  const top = TOP[c.body];
  const eyes = c.extras.includes('shades')
    ? ''
    : `<circle cx="62" cy="92" r="6" fill="${INK}"/><circle cx="98" cy="92" r="6" fill="${INK}"/><circle cx="64" cy="90" r="2" fill="#fff"/><circle cx="100" cy="90" r="2" fill="#fff"/>`;
  const blush = mood === 'happy' ? `<circle cx="50" cy="110" r="7" fill="#ff7466" opacity=".35"/><circle cx="110" cy="110" r="7" fill="#ff7466" opacity=".35"/>` : '';
  const face = c.extras.filter((e) => e === 'glasses' || e === 'shades' || e === 'mustache').map((e) => extra(e, top)).join('');
  const hats = c.extras.filter((e) => e !== 'glasses' && e !== 'shades' && e !== 'mustache').map((e) => extra(e, top)).join('');
  return `<svg viewBox="0 -20 160 190" width="160" height="190" aria-hidden="true">
    <g ${ST} fill="${c.color}">${BODIES[c.body]}</g>
    ${eyes}${brows(mood)}${blush}${mouth(mood)}${face}${hats}
  </svg>`;
}
