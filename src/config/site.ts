// The ONLY file that may contain the site name, domain, socials or analytics IDs.

export const SITE_NAME = 'BoredToys';
export const DOMAIN = 'boredtoys.com';

export const SITE = {
  name: SITE_NAME,
  domain: DOMAIN,
  url: `https://${DOMAIN}`,
  tagline: 'Tiny, silly games for when you are bored',
  description:
    'Free, silly browser games and toys you can play in seconds. No downloads, no sign-ups, just fun games to play when bored.',
  locale: 'en_US',
  lang: 'en',
  contactEmail: `hello@${DOMAIN}`,
  socials: {
    x: '', // handle without @, e.g. 'boredtoys'
    instagram: '',
    tiktok: '',
    reddit: '',
  },
};

export const ANALYTICS = {
  cloudflareToken: '', // Cloudflare Web Analytics token
  googleSiteVerification: '', // Google Search Console meta tag content
};

export const ADS_ENABLED = false;
export const AD_SLOT_HEIGHT = 250;

export const SPONSORS_ENABLED = false;

// Leave empty until prices are decided. Empty values are never shown.
export const SPONSOR_PRICES: Record<'homeTile' | 'gameBar' | 'footer', string> = {
  homeTile: '',
  gameBar: '',
  footer: '',
};

export const NEW_BADGE_DAYS = 7;

export const CATEGORY_KEYS = [
  'reflex',
  'memory',
  'puzzle',
  'drawing',
  'quiz',
  'toy',
  'simulation',
] as const;

export type Category = (typeof CATEGORY_KEYS)[number];

export interface CategoryInfo {
  label: string;
  emoji: string;
  color: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string[];
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  reflex: {
    label: 'Reflex',
    emoji: '⚡',
    color: 'var(--tomato)',
    h1: 'Free Reflex Games',
    metaTitle: 'Free Reflex Games to Test Your Reaction Speed',
    metaDescription:
      'Free reflex games that test how fast your hands and eyes really are. Click, tap and dodge in quick rounds, then try to beat your own best time.',
    intro: [
      'Reflex games are all about speed. Something happens on the screen, and you react as fast as you can. Each round takes seconds, so you can squeeze one in while the kettle boils.',
      'Your best scores stay saved in your own browser, so you can come back tomorrow and see if your fingers got any faster. No sign-up, no downloads, just you against the clock.',
      'Try a round with your phone and then with a mouse. Many people find one is much faster than the other, and finding out which one wins is half the fun. Warm up with a couple of practice taps before you chase a new record.',
    ],
  },
  memory: {
    label: 'Memory',
    emoji: '🧠',
    color: 'var(--grape)',
    h1: 'Free Memory Games',
    metaTitle: 'Free Memory Games to Train Your Brain Online',
    metaDescription:
      'Free memory games you can play right in your browser. Remember patterns, numbers and pictures, then see how far your brain can go before it gives up.',
    intro: [
      'Memory games ask your brain to hold on to things for a little while: colors, numbers, shapes or where something was hiding. They start easy and sneak up on you.',
      'Every game runs in your browser with nothing to install. Your best score is saved on your device, so you can try again and watch yourself improve.',
      'Short memory games are a nice way to wake your brain up in the morning or give it a stretch after a long day of staring at screens. Play a few rounds in a row and you may notice your focus getting sharper each time.',
    ],
  },
  puzzle: {
    label: 'Puzzle',
    emoji: '🧩',
    color: 'var(--sky)',
    h1: 'Free Puzzle Games',
    metaTitle: 'Free Puzzle Games You Can Play in Your Browser',
    metaDescription:
      'Free puzzle games that twist your brain in silly ways. Solve odd rules, crack strange riddles and see how long it takes you to beat each one online.',
    intro: [
      'Puzzle games give you a problem and let you figure it out your own way. Some are logic, some are word play, and some are just plain ridiculous.',
      'There are no timers breathing down your neck unless you want them. Take a break, come back, and the puzzle will still be waiting for you.',
      'If you get stuck, step away for a minute. Fresh eyes spot things tired eyes miss. And when you finally crack a tricky one, share it with a friend and watch them struggle with the very same puzzle that got you.',
    ],
  },
  drawing: {
    label: 'Drawing',
    emoji: '✏️',
    color: 'var(--mint)',
    h1: 'Free Drawing Games',
    metaTitle: 'Free Drawing Games to Test Your Steady Hand',
    metaDescription:
      'Free drawing games that score how steady your hand really is. Draw with a mouse or finger, get an instant score and try again until it looks perfect.',
    intro: [
      'Drawing games turn your mouse or finger into a pencil and then judge you for it. Nicely, of course. You draw, the game checks, and you get a score right away.',
      'You do not need to be an artist. These games are about steady hands and a little patience, and every attempt only takes a few seconds.',
      'Try drawing with your other hand for a laugh, or switch between a finger on a phone and a mouse on a computer. Your scores will change a lot, and you will learn which way gives you the smoothest lines.',
    ],
  },
  quiz: {
    label: 'Quiz',
    emoji: '❓',
    color: 'var(--sunshine)',
    h1: 'Free Quiz Games',
    metaTitle: 'Free Quiz Games With Silly Questions to Answer',
    metaDescription:
      'Free quiz games full of silly questions and odd choices. Pick your answers, see your own results at the end and share them with your friends online.',
    intro: [
      'Quiz games ask you questions and make you pick. Some have right answers. Others are just about what you would do when every choice is a little bit absurd.',
      'Your answers stay on your device. There are no fake stats and no made-up crowd votes, just your own choices and a summary at the end.',
      'These are great to play with friends or family. Pass the phone around, compare what everyone picked, and argue about it at dinner. There is no wrong way to play, as long as you are honest with yourself.',
    ],
  },
  toy: {
    label: 'Toy',
    emoji: '🪀',
    color: 'var(--bubblegum)',
    h1: 'Free Online Toys',
    metaTitle: 'Free Online Toys to Play With When You Are Bored',
    metaDescription:
      'Free online toys with no goal and no pressure. Poke, drag and click silly little things in your browser until you feel better about the whole day.',
    intro: [
      'Online toys are things you play with, not games you win. You poke them, they do something fun, and that is the whole point.',
      'They are perfect when your brain needs a tiny break. Open one, mess around for a minute, then get back to whatever you were avoiding.',
      'Toys are also great for kids and grown-ups to play together. There is nothing to lose and nothing to score, so nobody gets upset. Just open one up, see what it does, and have a little laugh at the silliness.',
    ],
  },
  simulation: {
    label: 'Simulation',
    emoji: '💸',
    color: 'var(--tangerine)',
    h1: 'Free Simulation Games',
    metaTitle: 'Free Simulation Games to Play in Your Browser',
    metaDescription:
      'Free simulation games that let you try silly what-if ideas, like spending a billionaire fortune. Play in your browser with no sign-up and share results.',
    intro: [
      'Simulation games let you try things you could never do in real life. Spend a giant fortune, run a pretend world, or see what happens when you push a silly idea too far.',
      'Everything happens right in your browser. Play for a minute or an hour, and share your results with friends when you are done.',
      'Some of our simulations use real numbers, like real net worth figures and real price tags, so you also learn something while you play. Every number we use comes with a date and a source so you can check it yourself.',
    ],
  },
};

export const FOOTER_LINES = [
  'Made with too much coffee ☕',
  'No vegetables were harmed 🥕',
  'Powered by snacks and stubbornness 🍪',
  'Built during several very long lunch breaks 🥪',
  'Tested on at least one very patient cat 🐈',
  '100% free-range pixels 🐔',
  'Contains zero calories 🍩',
  'Now with 12% more wiggle 🪱',
  'Assembled by tiny invisible elves 🧝',
  'Please do not lick the screen 👅',
  'Handmade, slightly wonky, fully fun 🧶',
  'Best enjoyed while avoiding chores 🧹',
];
