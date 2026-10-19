export type Personality = 'impatient' | 'stingy' | 'generous' | 'bluffer';
export type Body = 'round' | 'tall' | 'bean' | 'square';
export type Extra = 'glasses' | 'shades' | 'tophat' | 'cap' | 'beanie' | 'bow' | 'mustache' | 'antenna' | 'flower' | 'crown' | 'headphones';

export interface Character {
  name: string;
  kind: Personality;
  body: Body;
  color: string;
  extras: Extra[];
}

export interface Item {
  name: string;
  value: number;
  icon: string;
}

export const CHARACTERS: Character[] = [
  { name: 'Mildred Fuzzwick', kind: 'stingy', body: 'round', color: '#c7a3ff', extras: ['glasses'] },
  { name: 'Captain Doodle', kind: 'generous', body: 'square', color: '#6cc8ff', extras: ['cap', 'mustache'] },
  { name: 'Zippy Pete', kind: 'impatient', body: 'tall', color: '#ff7466', extras: ['antenna'] },
  { name: 'Lady Bramble', kind: 'bluffer', body: 'bean', color: '#ffa3d1', extras: ['bow'] },
  { name: 'Gus Grumbleton', kind: 'stingy', body: 'square', color: '#6be3a8', extras: ['mustache'] },
  { name: 'Professor Nib', kind: 'generous', body: 'tall', color: '#ffd447', extras: ['glasses', 'mustache'] },
  { name: 'Dot Quickly', kind: 'impatient', body: 'round', color: '#ffd447', extras: ['headphones'] },
  { name: 'Slick Ricky', kind: 'bluffer', body: 'bean', color: '#ffac57', extras: ['shades'] },
  { name: 'Auntie Plum', kind: 'generous', body: 'round', color: '#c7a3ff', extras: ['flower'] },
  { name: 'Barnaby Stitch', kind: 'stingy', body: 'tall', color: '#6cc8ff', extras: ['beanie'] },
  { name: 'Tilly Ticktock', kind: 'impatient', body: 'square', color: '#ffa3d1', extras: ['bow'] },
  { name: 'The Great Ferdinand', kind: 'bluffer', body: 'tall', color: '#6be3a8', extras: ['tophat'] },
  { name: 'Moss', kind: 'generous', body: 'bean', color: '#6be3a8', extras: ['flower'] },
  { name: 'Penny Pinchley', kind: 'stingy', body: 'bean', color: '#ffd447', extras: ['glasses'] },
  { name: 'Turbo Tess', kind: 'impatient', body: 'bean', color: '#6cc8ff', extras: ['cap'] },
  { name: 'Duchess Waffle', kind: 'bluffer', body: 'round', color: '#ffac57', extras: ['crown'] },
];

export const KIND_LABEL: Record<Personality, string> = {
  impatient: 'In a hurry',
  stingy: 'Penny pincher',
  generous: 'Big spender',
  bluffer: 'Sneaky bluffer',
};

export interface Rules {
  maxMin: number;
  maxMax: number;
  openMin: number;
  openMax: number;
  patience: number;
  step: number;
}

/** Hidden max is a multiple of the sticker price; the opening offer is a share of the hidden max. */
export const RULES: Record<Personality, Rules> = {
  generous: { maxMin: 1.15, maxMax: 1.45, openMin: 0.65, openMax: 0.75, patience: 4, step: 0.5 },
  stingy: { maxMin: 0.7, maxMax: 0.95, openMin: 0.4, openMax: 0.5, patience: 3, step: 0.25 },
  impatient: { maxMin: 0.95, maxMax: 1.2, openMin: 0.6, openMax: 0.7, patience: 2, step: 0.45 },
  bluffer: { maxMin: 0.9, maxMax: 1.3, openMin: 0.35, openMax: 0.45, patience: 3, step: 0.35 },
};

type Lines = Record<'greet' | 'counter' | 'insulted' | 'final' | 'accept' | 'cheap' | 'walk', string[]>;

export const LINES: Record<Personality, Lines> = {
  generous: {
    greet: ['Oh my! Is that {item}? I simply must have it.', 'What a treasure! {item}, just like the one I never had.'],
    counter: ['Hmm, a little steep. How about {offer}?', 'I like your style. Let us say {offer}.', 'You drive a hard bargain! {offer}?'],
    insulted: ['Goodness, that is a lot! Maybe {offer}?', 'Oof, my wallet just gasped. {offer}?'],
    final: ['I really want it, but {offer} is about all I have.', 'Help me out here. {offer}, please?'],
    accept: ['Wonderful! A deal!', 'Sold! I will treasure it forever.'],
    cheap: ['Only that much? You are too kind!', 'Are you sure? Well, I will not argue!'],
    walk: ['Oh dear, that is too rich for me. Bye now!'],
  },
  stingy: {
    greet: ['I suppose {item} could be useful. If it is cheap.', 'I am here for {item}. I have a coupon somewhere.'],
    counter: ['Absolutely not. {offer}, take it or leave it.', 'I could buy three of those for... fine, {offer}.', 'Ugh. {offer}. And I want a receipt.'],
    insulted: ['WHAT? For that? I will give you {offer}.', 'My grandmother paid less for her house. {offer}.'],
    final: ['{offer}. That is my final offer. I mean it.', 'Not one cent more than {offer}.'],
    accept: ['Fine. Deal. Do not tell anyone.', 'Hmph. Deal.'],
    cheap: ['Ha! You undersold it. Deal!', 'A bargain! I knew today was lucky.'],
    walk: ['Robbery! I am going to the other stall.', 'I will find one in a dumpster for free. Goodbye.'],
  },
  impatient: {
    greet: ['Quick quick, how much for {item}?', 'I have a bus in four minutes. {item}. Go.'],
    counter: ['No time. {offer}. Yes or no?', 'Ugh, fine, {offer}, hurry!'],
    insulted: ['Seriously? {offer}, last chance, my bus is here!', 'Too much, too slow! {offer}!'],
    final: ['{offer}! Decide! Now!', 'Tick tock! {offer} or I am gone!'],
    accept: ['Deal! Bye!', 'Done! Gotta run!'],
    cheap: ['Sure, whatever, deal!', 'Yes! Great! Bye!'],
    walk: ['Forget it, I missed my bus anyway!', 'Too slow! I am out!'],
  },
  bluffer: {
    greet: ['I am not even that interested in {item}. Just looking. Totally.', 'Oh, {item}? I have five at home. Maybe six.'],
    counter: ['Pfft. {offer}. And that is generous.', 'I saw one cheaper down the road. {offer}.', 'My final offer is {offer}. Probably.'],
    insulted: ['Ha! Nobody would pay that. {offer}, final answer.', 'I am leaving... unless you say {offer}.'],
    final: ['{offer}. My absolute final offer. For real this time.', 'You will never hear a better offer than {offer}.'],
    accept: ['Fine! You got lucky. Deal.', 'Deal. I was going to pay more anyway. Just kidding. Or am I?'],
    cheap: ['Hah, I would have paid way more! Deal!', 'You fell for my poker face. Deal!'],
    walk: ['I really am leaving this time. Bye!', 'Enjoy your junk! I am off!'],
  },
};

export const FAKE_WALK = [
  'Fine! I am leaving! ...okay, wait. I came back. One more try.',
  'That is it, I am out! ...my shoelace is untied. Fine, one more offer.',
];

const S = 'stroke="#1f1a2e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';

export const ITEMS: Item[] = [
  { name: 'a lamp shaped like a disappointed goose', value: 45, icon: `<path ${S} d="M14 40h20l-4-8H18z" fill="#ffac57"/><path ${S} d="M24 32V18c0-6 4-10 9-10s7 4 5 7l-6 1" fill="#fffdf7"/><circle cx="33" cy="12" r="1.8" fill="#1f1a2e"/>` },
  { name: 'one left roller skate', value: 18, icon: `<path ${S} d="M10 30V12h12l2 10 14 3c3 1 4 3 4 5H10z" fill="#ffa3d1"/><circle ${S} cx="16" cy="36" r="4" fill="#ffd447"/><circle ${S} cx="34" cy="36" r="4" fill="#ffd447"/>` },
  { name: 'a rubber duck that is probably haunted', value: 12, icon: `<path ${S} d="M10 30c0-6 6-8 12-8-2-3-2-10 5-11 6 0 8 6 5 10l6 0c2 6-2 15-14 15-9 0-14-2-14-6z" fill="#ffd447"/><path ${S} d="M36 18l6 1-6 3" fill="#ffac57"/><circle cx="30" cy="16" r="1.8" fill="#1f1a2e"/>` },
  { name: 'a cassette of whales arguing', value: 9, icon: `<rect ${S} x="6" y="12" width="36" height="24" rx="3" fill="#6cc8ff"/><circle ${S} cx="17" cy="24" r="4" fill="#fff"/><circle ${S} cx="31" cy="24" r="4" fill="#fff"/><path ${S} d="M14 36l3-6h14l3 6" fill="none"/>` },
  { name: 'a tiny chair for a large cat', value: 30, icon: `<path ${S} d="M14 8v32M34 22v18M14 22h20M14 28h20" fill="none"/><rect ${S} x="14" y="20" width="20" height="6" rx="2" fill="#ffac57"/>` },
  { name: 'an accordion missing one note', value: 120, icon: `<rect ${S} x="4" y="12" width="10" height="24" rx="2" fill="#ff7466"/><rect ${S} x="34" y="12" width="10" height="24" rx="2" fill="#ff7466"/><path ${S} d="M14 14l4 20 4-20 4 20 4-20 4 20" fill="#fffdf7"/>` },
  { name: 'a snow globe with no snow', value: 15, icon: `<circle ${S} cx="24" cy="20" r="14" fill="#eaf7ff"/><rect ${S} x="12" y="32" width="24" height="9" rx="3" fill="#c7a3ff"/><path ${S} d="M20 26l4-8 4 8z" fill="#6be3a8"/>` },
  { name: 'a moon-shaped waffle iron', value: 60, icon: `<path ${S} d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z" fill="#ffd447"/><path ${S} d="M16 20h12M16 28h14M22 14v20" fill="none"/>` },
  { name: 'a signed photo of a total stranger', value: 8, icon: `<rect ${S} x="8" y="6" width="32" height="36" rx="2" fill="#fffdf7"/><circle ${S} cx="24" cy="20" r="6" fill="#ffac57"/><path ${S} d="M14 32c4-6 16-6 20 0M14 38c4-2 6 2 10-1s6 1 10-1" fill="none"/>` },
  { name: 'a teapot that hums at night', value: 40, icon: `<path ${S} d="M10 22h24v10c0 6-4 9-12 9s-12-3-12-9z" fill="#6be3a8"/><path ${S} d="M34 26c6-2 8 2 4 6M10 26L4 20" fill="none"/><path ${S} d="M18 22c0-5 8-5 8 0" fill="#6be3a8"/><path ${S} d="M38 8l2 4M42 12l-4 0" fill="none"/>` },
  { name: 'glow-in-the-dark socks (mostly a pair)', value: 10, icon: `<path ${S} d="M12 6h10v20l8 6c3 3 1 9-4 8l-12-6c-2-1-2-3-2-5z" fill="#6be3a8"/><path ${S} d="M28 6h8v14" fill="none" stroke-dasharray="3 3"/>` },
  { name: 'a bouncy castle with a small leak', value: 150, icon: `<path ${S} d="M6 40V18l6 4 6-6 6 6 6-6 6 6 6-4v22z" fill="#ffa3d1"/><path ${S} d="M20 40v-8a4 4 0 0 1 8 0v8" fill="#fffdf7"/><path ${S} d="M42 12c2-2 4 0 2 2" fill="none"/>` },
  { name: 'a Participation Trophy from 1998', value: 14, icon: `<path ${S} d="M14 8h20v8c0 6-4 10-10 10s-10-4-10-10z" fill="#ffd447"/><path ${S} d="M24 26v8M16 40h16l-2-6H18z" fill="#ffac57"/>` },
  { name: 'a garden gnome wearing sunglasses', value: 35, icon: `<path ${S} d="M24 4l10 16H14z" fill="#ff7466"/><circle ${S} cx="24" cy="24" r="7" fill="#ffd9c2"/><path ${S} d="M17 24h14" stroke-width="4" fill="none"/><path ${S} d="M14 42c0-8 4-12 10-12s10 4 10 12z" fill="#6cc8ff"/>` },
  { name: 'a mystery key that opens something', value: 20, icon: `<circle ${S} cx="14" cy="24" r="8" fill="#ffd447"/><path ${S} d="M22 24h20M34 24v6M40 24v4" fill="none"/>` },
  { name: 'a ukulele with three strings', value: 55, icon: `<path ${S} d="M14 40c-6 0-8-6-6-10s2-6 6-8l14-14 4 4-14 14c-2 4-4 4-8 6" fill="#ffac57"/><path ${S} d="M28 8l6-4 4 4-4 6" fill="#1f1a2e"/>` },
  { name: 'a box of 400 assorted buttons', value: 25, icon: `<rect ${S} x="6" y="18" width="36" height="22" rx="3" fill="#c7a3ff"/><circle ${S} cx="16" cy="14" r="5" fill="#ff7466"/><circle ${S} cx="28" cy="12" r="5" fill="#6cc8ff"/><circle ${S} cx="36" cy="15" r="4" fill="#ffd447"/>` },
  { name: 'an umbrella with extra air holes', value: 6, icon: `<path ${S} d="M6 24C6 14 14 8 24 8s18 6 18 16z" fill="#6cc8ff"/><path ${S} d="M24 24v14c0 4 6 4 6 0" fill="none"/><circle cx="16" cy="18" r="2" fill="#fffdf7"/><circle cx="30" cy="16" r="2" fill="#fffdf7"/>` },
];
