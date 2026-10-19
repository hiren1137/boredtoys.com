export type Trait = 'cozy' | 'bold' | 'chaos' | 'order';

export interface Side {
  label: string;
  emoji: string;
  trait: Trait;
}

export interface Prompt {
  id: string;
  theme: string;
  q: string;
  a: Side;
  b: Side;
}

const s = (label: string, emoji: string, trait: Trait): Side => ({ label, emoji, trait });

export const PROMPTS: Prompt[] = [
  { id: 'taco-pizza', theme: 'Food', q: 'Is a taco just a folded pizza?', a: s('Obviously yes', '🌮', 'chaos'), b: s('Absolutely not', '🍕', 'order') },
  { id: 'pancake-waffle', theme: 'Food', q: 'Pancakes or waffles?', a: s('Fluffy pancakes', '🥞', 'cozy'), b: s('Waffles, for the syrup grid', '🧇', 'order') },
  { id: 'crust', theme: 'Food', q: 'The crust on your toast: eat it or leave it?', a: s('Eat every bit', '🍞', 'order'), b: s('Leave it on the plate', '🚫', 'chaos') },
  { id: 'ketchup-eggs', theme: 'Food', q: 'Ketchup on scrambled eggs: genius or a crime?', a: s('Pure genius', '🍳', 'bold'), b: s('A breakfast crime', '🚨', 'order') },
  { id: 'fries-shake', theme: 'Food', q: 'Dipping fries into a milkshake: yes or no?', a: s('Yes, salty plus sweet', '🍟', 'bold'), b: s('Keep them apart', '🥤', 'order') },
  { id: 'soup-mug', theme: 'Food', q: 'If you sip soup from a mug, is it a drink?', a: s('It is a drink now', '☕', 'chaos'), b: s('Still soup', '🥣', 'order') },
  { id: 'cold-pizza', theme: 'Food', q: 'Leftover pizza: cold from the fridge or warmed up?', a: s('Cold and proud', '🧊', 'chaos'), b: s('Warm it up', '🔥', 'cozy') },
  { id: 'cone-cup', theme: 'Food', q: 'Ice cream in a cone or in a cup?', a: s('Cone, drips and all', '🍦', 'bold'), b: s('Cup, no mess', '🍨', 'order') },
  { id: 'cereal-milk', theme: 'Food', q: 'The milk left after cereal: slurp it or pour it out?', a: s('Slurp it', '🥛', 'cozy'), b: s('Down the sink', '🚰', 'order') },
  { id: 'toast', theme: 'Food', q: 'Is toast just warm bread, or a whole new food?', a: s('A whole new food', '✨', 'chaos'), b: s('Just warm bread', '🍞', 'order') },
  { id: 'last-slice', theme: 'Food', q: 'There is one slice left. Share it or claim it?', a: s('Cut it in half', '🤝', 'cozy'), b: s('Claim it fast', '🏃', 'bold') },

  { id: 'shower-time', theme: 'Daily Life', q: 'Shower in the morning or at night?', a: s('Morning wake-up', '🌅', 'bold'), b: s('Night, then bed', '🌙', 'cozy') },
  { id: 'bed-socks', theme: 'Daily Life', q: 'Wearing socks in bed: cozy or wrong?', a: s('So cozy', '🧦', 'cozy'), b: s('Totally wrong', '🙅', 'order') },
  { id: 'battery', theme: 'Daily Life', q: 'Your phone battery: always charged or living at 4%?', a: s('Always charged', '🔋', 'order'), b: s('4% and thriving', '🪫', 'chaos') },
  { id: 'make-bed', theme: 'Daily Life', q: 'Make your bed every morning?', a: s('Every single day', '🛏️', 'order'), b: s('I will sleep in it again', '😴', 'chaos') },
  { id: 'seat', theme: 'Daily Life', q: 'On a long trip: window seat or aisle seat?', a: s('Window, for the view', '🪟', 'cozy'), b: s('Aisle, for freedom', '🚶', 'order') },
  { id: 'bird-owl', theme: 'Daily Life', q: 'Early bird or night owl?', a: s('Early bird', '🐦', 'order'), b: s('Night owl', '🦉', 'chaos') },
  { id: 'instructions', theme: 'Daily Life', q: 'New gadget: read the instructions or just figure it out?', a: s('Read them first', '📖', 'order'), b: s('Figure it out', '🔧', 'bold') },
  { id: 'tabs', theme: 'Daily Life', q: 'How many browser tabs do you keep open?', a: s('A neat three', '3️⃣', 'order'), b: s('Somewhere near 87', '🗂️', 'chaos') },
  { id: 'texts', theme: 'Daily Life', q: 'Reply to texts right away or three days later?', a: s('Right away', '⚡', 'order'), b: s('Three days later', '🐌', 'chaos') },
  { id: 'laundry', theme: 'Daily Life', q: 'Clean laundry: fold it now or start a chair pile?', a: s('Fold it now', '👕', 'order'), b: s('The chair pile', '🪑', 'cozy') },
  { id: 'pens', theme: 'Daily Life', q: 'Clicky pens or pens with caps?', a: s('Click click click', '🖊️', 'chaos'), b: s('Caps, safely closed', '✒️', 'order') },
  { id: 'shower-singing', theme: 'Daily Life', q: 'Do you sing in the shower?', a: s('Full concert', '🎤', 'bold'), b: s('Silent shower', '🤐', 'order') },

  { id: 'dragon-cat', theme: 'What If', q: 'A pet dragon the size of a cat, or a cat the size of a dragon?', a: s('Tiny dragon', '🐉', 'bold'), b: s('Giant cat', '🐈', 'cozy') },
  { id: 'talk', theme: 'What If', q: 'Talk to animals, or speak every human language?', a: s('Chat with animals', '🐾', 'chaos'), b: s('Every language', '🗣️', 'order') },
  { id: 'teleport', theme: 'What If', q: 'Teleport anywhere but always arrive sneezing, or fly but only 2 feet off the ground?', a: s('Sneezy teleport', '🤧', 'bold'), b: s('Very low flying', '🪂', 'chaos') },
  { id: 'home', theme: 'What If', q: 'Live in a giant treehouse or an underwater dome?', a: s('Treehouse', '🌳', 'cozy'), b: s('Underwater dome', '🐠', 'bold') },
  { id: 'remote', theme: 'What If', q: 'A remote for your life: rewind button or pause button?', a: s('Rewind', '⏪', 'order'), b: s('Pause', '⏸️', 'cozy') },
  { id: 'weather-toe', theme: 'What If', q: 'Always know tomorrow\'s weather, or never stub your toe again?', a: s('Know the weather', '🌦️', 'order'), b: s('Safe toes forever', '🦶', 'cozy') },
  { id: 'explore', theme: 'What If', q: 'Explore outer space or the deepest ocean?', a: s('Outer space', '🚀', 'bold'), b: s('The deep ocean', '🦑', 'chaos') },
  { id: 'theme-song', theme: 'What If', q: 'A theme song every time you walk in, or a laugh track for your jokes?', a: s('Theme song', '🎺', 'bold'), b: s('Laugh track', '😂', 'chaos') },

  { id: 'cats-dogs', theme: 'Animals', q: 'Cats or dogs?', a: s('Cats', '🐱', 'cozy'), b: s('Dogs', '🐶', 'bold') },
  { id: 'penguin-tie', theme: 'Animals', q: 'A penguin going to a party: regular tie or bow tie?', a: s('Regular tie', '👔', 'order'), b: s('Bow tie', '🎀', 'bold') },
  { id: 'birds', theme: 'Animals', q: 'Are birds just tiny dinosaurs with jobs?', a: s('Tiny dinosaurs', '🦖', 'chaos'), b: s('They are just birds', '🐦', 'order') },
  { id: 'hedgehog', theme: 'Animals', q: 'Is a hedgehog a spiky hamster or a cactus with legs?', a: s('Spiky hamster', '🐹', 'cozy'), b: s('Cactus with legs', '🌵', 'chaos') },
  { id: 'frogs-vote', theme: 'Animals', q: 'Should frogs be allowed to vote?', a: s('Yes, ribbit', '🐸', 'chaos'), b: s('No, they are frogs', '🗳️', 'order') },
  { id: 'robot-vacuum', theme: 'Animals', q: 'Is a robot vacuum a pet?', a: s('A pet with a name', '🥰', 'cozy'), b: s('It is a machine', '🤖', 'order') },

  { id: 'water-wet', theme: 'Big Debates', q: 'Is water wet?', a: s('Water is wet', '💧', 'chaos'), b: s('It makes things wet', '🧽', 'order') },
  { id: 'dishwasher', theme: 'Big Debates', q: 'Does loading the dishwasher count as doing the dishes?', a: s('Totally counts', '🍽️', 'order'), b: s('Not even close', '🧼', 'bold') },
  { id: 'beanbag', theme: 'Big Debates', q: 'Is a beanbag a chair or a giant pillow?', a: s('A chair', '🪑', 'order'), b: s('A giant pillow', '🛋️', 'cozy') },
  { id: 'clap-plane', theme: 'Big Debates', q: 'Clap when the plane lands?', a: s('Clap loudly', '👏', 'bold'), b: s('Stay quiet', '🤫', 'order') },
  { id: 'spoilers', theme: 'Big Debates', q: 'Knowing the ending before you watch a movie: fine or ruined?', a: s('Fine by me', '🍿', 'chaos'), b: s('Totally ruined', '😱', 'order') },
  { id: 'thumb', theme: 'Big Debates', q: 'Is a thumb a finger?', a: s('Yes, a finger', '👍', 'order'), b: s('Its own thing', '🖐️', 'chaos') },
  { id: 'seasons', theme: 'Big Debates', q: 'Summer or winter?', a: s('Summer sun', '☀️', 'bold'), b: s('Winter blankets', '❄️', 'cozy') },
  { id: 'monday', theme: 'Big Debates', q: 'Is Monday a day or a mood?', a: s('Just a day', '📅', 'order'), b: s('Definitely a mood', '😩', 'chaos') },
  { id: 'mountain-beach', theme: 'Big Debates', q: 'Vacation in the mountains or at the beach?', a: s('Mountains', '🏔️', 'cozy'), b: s('Beach', '🏖️', 'bold') },
];

export interface Persona {
  name: string;
  emoji: string;
  blurb: string;
}

type Pair = `${Trait}+${Trait}`;

/** Keyed by the player's top trait, then their second trait. */
export const PERSONAS: Record<Pair, Persona> = {
  'cozy+bold': { name: 'The Brave Blanket Burrito', emoji: '🌯', blurb: 'You love comfort, but you will leave the blanket for a good adventure.' },
  'cozy+chaos': { name: 'The Snuggly Gremlin', emoji: '🧸', blurb: 'Soft on the outside, wonderfully weird on the inside.' },
  'cozy+order': { name: 'The Tidy Teapot', emoji: '🫖', blurb: 'Warm, calm and organized. Everyone wants to nap at your place.' },
  'bold+cozy': { name: 'The Campfire Captain', emoji: '🔥', blurb: 'You lead the adventure, then make sure everyone gets a marshmallow.' },
  'bold+chaos': { name: 'The Thunder Raccoon', emoji: '🦝', blurb: 'Loud, fearless and slightly unpredictable. Honestly, iconic.' },
  'bold+order': { name: 'The Fearless Planner', emoji: '🗺️', blurb: 'You take big swings, but you packed snacks and a backup map.' },
  'chaos+cozy': { name: 'The Pajama Wizard', emoji: '🪄', blurb: 'Strange ideas, comfy clothes. You make weird feel welcoming.' },
  'chaos+bold': { name: 'The Rocket Goblin', emoji: '🚀', blurb: 'Rules are suggestions and the suggestion is: faster.' },
  'chaos+order': { name: 'The Organized Chaos Engine', emoji: '🌀', blurb: 'Your choices look random, but there is a system. Probably.' },
  'order+cozy': { name: 'The Labeled Sock Drawer', emoji: '🧺', blurb: 'Everything in its place, and that place is soft and warm.' },
  'order+bold': { name: 'The Clipboard Hero', emoji: '📋', blurb: 'You make a plan, then you actually do the plan. Rare!' },
  'order+chaos': { name: 'The Rule-Bending Librarian', emoji: '📚', blurb: 'Mostly by the book, with a few pages you wrote yourself.' },
  'cozy+cozy': { name: 'The Tidy Teapot', emoji: '🫖', blurb: 'Warm, calm and organized. Everyone wants to nap at your place.' },
  'bold+bold': { name: 'The Thunder Raccoon', emoji: '🦝', blurb: 'Loud, fearless and slightly unpredictable. Honestly, iconic.' },
  'chaos+chaos': { name: 'The Rocket Goblin', emoji: '🚀', blurb: 'Rules are suggestions and the suggestion is: faster.' },
  'order+order': { name: 'The Clipboard Hero', emoji: '📋', blurb: 'You make a plan, then you actually do the plan. Rare!' },
};

export const TRAIT_NAMES: Record<Trait, string> = {
  cozy: 'Cozy',
  bold: 'Bold',
  chaos: 'Chaotic',
  order: 'Orderly',
};
