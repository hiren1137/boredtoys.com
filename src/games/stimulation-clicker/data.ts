export type UpgradeId =
  | 'sparkle'
  | 'square'
  | 'meter'
  | 'ticker'
  | 'poker'
  | 'logo'
  | 'confetti'
  | 'beat'
  | 'pings'
  | 'stonks'
  | 'pinwheel'
  | 'dash'
  | 'shapes'
  | 'rainbow'
  | 'hype'
  | 'turbo'
  | 'pinata'
  | 'bass'
  | 'clones'
  | 'wobble'
  | 'doubler'
  | 'hyper'
  | 'peace';

export interface Effect {
  spcAdd?: number;
  spcMul?: number;
  spsAdd?: number;
  spsMul?: number;
  shapes?: number;
  bounceMul?: number;
  logos?: number;
  logoMul?: number;
  /** Auto-clicks per second (replaces the previous rate). */
  auto?: number;
  allMul?: number;
}

export interface Upgrade {
  id: UpgradeId;
  name: string;
  desc: string;
  cost: number;
  effect: Effect;
}

export const UPGRADES: Upgrade[] = [
  { id: 'sparkle', name: 'Sparkle Fingers', desc: 'Every click throws sparkles. +1 per click.', cost: 15, effect: { spcAdd: 1 } },
  { id: 'square', name: 'One Bouncy Square', desc: 'A square bounces around. Each wall hit pays out.', cost: 40, effect: { shapes: 1 } },
  { id: 'meter', name: 'Per-Second Meter', desc: 'Watch a number about a number. +2 per second.', cost: 75, effect: { spsAdd: 2 } },
  { id: 'ticker', name: 'Breaking News Ticker', desc: 'Very important headlines scroll by. +5 per second.', cost: 150, effect: { spsAdd: 5 } },
  { id: 'poker', name: 'Robo-Poker', desc: 'A little robot hand clicks for you, twice a second.', cost: 260, effect: { auto: 2 } },
  { id: 'logo', name: 'Bouncing ZONK Logo', desc: 'It bounces off walls. Hit a corner for a jackpot.', cost: 450, effect: { logos: 1 } },
  { id: 'confetti', name: 'Confetti Cannon', desc: 'Every click is a party. Clicks are worth 2x.', cost: 700, effect: { spcMul: 2 } },
  { id: 'beat', name: 'Chill Beat Loop', desc: 'A beat to click and relax to. +25 per second.', cost: 1100, effect: { spsAdd: 25 } },
  { id: 'pings', name: 'Notification Pings', desc: 'Urgent messages pop up. Tap them for a bonus.', cost: 1700, effect: { spsAdd: 30 } },
  { id: 'stonks', name: 'Pretend Stock Board', desc: 'Made-up stocks go up and down. +60 per second.', cost: 2600, effect: { spsAdd: 60 } },
  { id: 'pinwheel', name: 'Pinwheel Party', desc: 'Pinwheels spin in the corners. Clicks are worth 2x.', cost: 4000, effect: { spcMul: 2 } },
  { id: 'dash', name: 'Tiny Video Game', desc: 'A tiny blob plays a tiny game. +120 per second.', cost: 6000, effect: { spsAdd: 120 } },
  { id: 'shapes', name: 'Shape Avalanche', desc: 'Six more shapes, and every bounce pays 3x.', cost: 9000, effect: { shapes: 6, bounceMul: 3 } },
  { id: 'rainbow', name: 'Rainbow Mode', desc: 'The background cannot pick a color. 1.5x per second.', cost: 13000, effect: { spsMul: 1.5 } },
  { id: 'hype', name: 'Personal Hype Guy', desc: 'He shouts nice things at you. Clicks are worth 3x.', cost: 19000, effect: { spcMul: 3 } },
  { id: 'turbo', name: 'Robo-Poker Turbo', desc: 'The robot hand had coffee. 6 clicks a second.', cost: 27000, effect: { auto: 6 } },
  { id: 'pinata', name: 'Surprise Pinata', desc: 'Pinatas drop in. Whack them for loot. +600 per second.', cost: 38000, effect: { spsAdd: 600 } },
  { id: 'bass', name: 'Bass Drop', desc: 'The beat gets faster and louder. 1.5x per second.', cost: 55000, effect: { spsMul: 1.5 } },
  { id: 'clones', name: 'Logo Clones', desc: 'Three more ZONK logos. Logo hits pay 4x.', cost: 80000, effect: { logos: 3, logoMul: 4 } },
  { id: 'wobble', name: 'Wobbly Screen', desc: 'Everything wobbles a bit. Clicks are worth 3x.', cost: 115000, effect: { spcMul: 3 } },
  { id: 'doubler', name: 'Everything Doubler', desc: 'Per second income is doubled. Why not.', cost: 160000, effect: { spsMul: 2 } },
  { id: 'hyper', name: 'Hyper Mode', desc: 'Faster, louder, shinier. Everything 1.5x.', cost: 230000, effect: { allMul: 1.5 } },
  { id: 'peace', name: 'Find Inner Peace', desc: 'Turn it all off. Breathe. This ends the game.', cost: 500000, effect: {} },
];

export const HEADLINES = [
  'Local person clicks button, feels something',
  'Scientists confirm the number going up is good',
  'Area cat refuses to look at bouncing square',
  'Breaking: the logo almost hit the corner',
  'Experts warn of dangerously high fun levels',
  'Inventor of buttons says he is not surprised',
  'Weather today: scattered confetti, light glitter',
  'Report: nobody has ever read this ticker to the end',
  'Stimulation reserves reach an all-time high',
  'Dentists now recommend clicking after meals',
  'Pinwheel spins, declines to comment',
  'Squirrels form a club, demand more pinwheels',
  'Your houseplant has started a podcast',
  'Man stares at screen, screen stares back',
  'Town council votes to make Tuesdays louder',
  'Robot hand asks for weekends off, is ignored',
  'Pigeon spotted reading the stock board',
  'Moon slightly jealous of the bouncing logo',
];

export const PINGS = [
  'Your toaster wants to connect',
  'Someone liked your click',
  'Reminder: you have a button',
  'New follower: a pigeon',
  'Your screen time is... let us not talk about it',
  'An update is ready for your update',
  'A sock went missing. Again.',
  'You have been chosen to click more',
  'Grandma sent a voice note (it is 40 minutes)',
  'Your fridge says hi',
  'Low battery on your imaginary phone',
  'The bouncing square misses you',
  'Achievement unlocked: looked at a notification',
  'Your pizza is now spiritually on its way',
];

export const STOCKS = ['BLOOP', 'NAPZ', 'GOOSE', 'WOBBL', 'SNACK', 'YAWNS', 'ZONK', 'SOCKO'];

export const HYPE = [
  'INCREDIBLE!',
  'WHAT A CLICK!',
  'LEGENDARY FINGER!',
  'THE CROWD GOES MILD!',
  'UNSTOPPABLE!',
  'CLICK OF THE YEAR!',
  'MOM, COME LOOK!',
  'TEXTBOOK FORM!',
  'YOU ARE A NATURAL!',
  'DO IT AGAIN!',
];
