export interface RuleContext {
  now: () => Date;
  digitTarget: number;
  factorA: number;
  factorB: number;
}

export interface Rule {
  id: string;
  text: (ctx: RuleContext) => string;
  check: (pw: string, ctx: RuleContext) => boolean;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PLANETS = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const COLOR_FRUITS = ['orange', 'lime', 'peach', 'plum', 'cherry', 'lemon', 'apricot', 'tangerine', 'raspberry', 'grape'];
const CAT_RHYMES = ['bat', 'hat', 'mat', 'rat', 'sat', 'pat', 'fat', 'vat', 'chat', 'flat', 'spat', 'that', 'brat', 'splat', 'gnat'];
const LAUGHS = ['lol', 'haha', 'hehe', 'hihi'];
export const MOON_EMOJI = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
export const MOON_NAMES = [
  'new moon',
  'waxing crescent',
  'first quarter',
  'waxing gibbous',
  'full moon',
  'waning gibbous',
  'last quarter',
  'waning crescent',
];
export const ANIMAL_EMOJI = [...'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🐢🐍🦎🦖🦕🐙🦑🦐🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐩🐈🐓🦃🦚🦜🦢🦩🐇🦝🦨🦡🦦🦥🐁🐀🦔'];
const DINOS = ['🦖', '🦕'];

const lower = (s: string) => s.toLowerCase();
const hasWord = (pw: string, list: string[]) => list.some((w) => lower(pw).includes(w));

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
/** Counts characters the way a person would, so an emoji is one character. */
export function charCount(pw: string): number {
  if (segmenter) {
    let n = 0;
    for (const _ of segmenter.segment(pw)) n++;
    return n;
  }
  return Array.from(pw).length;
}
const graphemes = (pw: string): string[] =>
  segmenter ? Array.from(segmenter.segment(pw), (s) => s.segment) : Array.from(pw);

export function emojiCount(pw: string): number {
  return graphemes(pw).filter((g) => /\p{Extended_Pictographic}/u.test(g)).length;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Moon phase index 0-7 using the average synodic month from a known new moon. */
export function moonPhaseIndex(d: Date): number {
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const synodic = 29.530588853;
  const age = ((d.getTime() - ref) / 86400000) % synodic;
  const frac = (age < 0 ? age + synodic : age) / synodic;
  return Math.floor(frac * 8 + 0.5) % 8;
}

function hourLabel(d: Date): string {
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${h < 12 ? 'am' : 'pm'}`;
}

function hasPalindrome(pw: string, min: number): boolean {
  const runs = lower(pw).match(/[a-z]+/g) ?? [];
  for (const run of runs) {
    for (let i = 0; i + min <= run.length; i++) {
      for (let j = i + min; j <= run.length; j++) {
        const s = run.slice(i, j);
        if (s === [...s].reverse().join('')) return true;
      }
    }
  }
  return false;
}

export const RULES: Rule[] = [
  { id: 'len6', text: () => 'Your password must be at least 6 characters long.', check: (pw) => charCount(pw) >= 6 },
  { id: 'digit', text: () => 'Your password must include a number.', check: (pw) => /\d/.test(pw) },
  { id: 'upper', text: () => 'Your password must include a capital letter.', check: (pw) => /[A-Z]/.test(pw) },
  {
    id: 'special',
    text: () => 'Your password must include a special character, like ! or #.',
    check: (pw) => /[^\p{L}\p{N}\s]/u.test(pw),
  },
  {
    id: 'digitsum',
    text: (c) => `All the digits in your password must add up to exactly ${c.digitTarget}.`,
    check: (pw, c) => (pw.match(/\d/g) ?? []).reduce((s, d) => s + Number(d), 0) === c.digitTarget,
  },
  { id: 'month', text: () => 'Your password must include a month of the year.', check: (pw) => hasWord(pw, MONTHS) },
  {
    id: 'roman',
    text: () => 'Your password must include a Roman numeral, written as a capital letter (I, V, X, L, C, D or M).',
    check: (pw) => /[IVXLCDM]/.test(pw),
  },
  { id: 'planet', text: () => 'Your password must include a planet from our solar system.', check: (pw) => hasWord(pw, PLANETS) },
  {
    id: 'weekday',
    text: () => 'Your password must include a day of the week. Any day. We are not picky.',
    check: (pw) => hasWord(pw, DAYS),
  },
  {
    id: 'hex',
    text: () => 'Your password must include a 6-digit color hex code, like #a1b2c3.',
    check: (pw) => /#[0-9a-f]{6}(?![0-9a-f])/i.test(pw),
  },
  {
    id: 'math',
    text: (c) => `Your password must include the answer to ${c.factorA} × ${c.factorB}.`,
    check: (pw, c) => pw.includes(String(c.factorA * c.factorB)),
  },
  {
    id: 'animal',
    text: () => 'Your password needs a pet. Include an animal emoji.',
    check: (pw) => ANIMAL_EMOJI.some((a) => pw.includes(a)),
  },
  {
    id: 'moon',
    text: (c) => `Include today's moon phase as an emoji. Tonight the moon is a ${MOON_NAMES[moonPhaseIndex(c.now())]}.`,
    check: (pw, c) => pw.includes(MOON_EMOJI[moonPhaseIndex(c.now())]),
  },
  {
    id: 'hour',
    text: () => 'Your password must include the current hour, written like 3pm or 11am.',
    check: (pw, c) => {
      const label = hourLabel(c.now());
      const re = new RegExp(`(^|\\D)${label.replace(/[ap]m$/, '')}${label.slice(-2)}`, 'i');
      return re.test(pw);
    },
  },
  {
    id: 'fruit',
    text: () => 'Your password must include a fruit that is also the name of a color.',
    check: (pw) => hasWord(pw, COLOR_FRUITS),
  },
  {
    id: 'rhyme',
    text: () => 'Your password must include a word that rhymes with "cat".',
    check: (pw) => hasWord(pw, CAT_RHYMES),
  },
  {
    id: 'prime',
    text: () => 'The length of your password must be a prime number.',
    check: (pw) => isPrime(charCount(pw)),
  },
  {
    id: 'leap',
    text: () => 'Your password must include a leap year, written with 4 digits.',
    check: (pw) => (pw.match(/\d{4,}/g) ?? []).some((run) => {
      for (let i = 0; i + 4 <= run.length; i++) {
        const y = Number(run.slice(i, i + 4));
        if (y >= 1000 && isLeap(y)) return true;
      }
      return false;
    }),
  },
  {
    id: 'laugh',
    text: () => 'Your password is far too serious. Include a laugh: lol, haha, hehe or hihi.',
    check: (pw) => hasWord(pw, LAUGHS),
  },
  {
    id: 'smiley',
    text: () => 'Your password must include a keyboard smiley, like :) or :D',
    check: (pw) => /[:;]-?[)DP(]/.test(pw),
  },
  {
    id: 'palindrome',
    text: () => 'Your password must include a word of at least 5 letters that reads the same backwards.',
    check: (pw) => hasPalindrome(pw, 5),
  },
  {
    id: 'dino',
    text: () => 'A dinosaur wants in. Include a dinosaur emoji.',
    check: (pw) => DINOS.some((d) => pw.includes(d)),
  },
  {
    id: 'emoji3',
    text: () => 'Your password must include exactly 3 emoji. No more, no less.',
    check: (pw) => emojiCount(pw) === 3,
  },
  {
    id: 'noe',
    text: () => 'The letter E has gone on vacation. Your password must not include any E or e.',
    check: (pw) => !/e/i.test(pw),
  },
  {
    id: 'nodouble',
    text: () => 'No two identical characters can sit next to each other.',
    check: (pw) => {
      const g = graphemes(pw);
      for (let i = 1; i < g.length; i++) if (g[i] === g[i - 1]) return false;
      return true;
    },
  },
  {
    id: 'startcap',
    text: () => 'Your password must start with a capital letter.',
    check: (pw) => /^[A-Z]/.test(pw),
  },
  {
    id: 'endbang',
    text: () => 'Your password must end with an exclamation mark, because it is very excited.',
    check: (pw) => pw.endsWith('!'),
  },
  {
    id: 'max60',
    text: () => 'Okay, that is enough. Your password must be 60 characters or fewer.',
    check: (pw) => charCount(pw) <= 60,
  },
];

export const HELPER_EMOJI: { emoji: string; label: string }[] = [
  ...MOON_EMOJI.map((emoji, i) => ({ emoji, label: MOON_NAMES[i] })),
  { emoji: '🦖', label: 'T-rex' },
  { emoji: '🦕', label: 'long-neck dinosaur' },
  { emoji: '🐢', label: 'turtle' },
  { emoji: '🐙', label: 'octopus' },
  { emoji: '🐸', label: 'frog' },
  { emoji: '🌮', label: 'taco' },
  { emoji: '🎈', label: 'balloon' },
  { emoji: '⭐', label: 'star' },
];
