export interface Track {
  /** What is on the track, e.g. "5 people". */
  label: string;
  /** How many things get hit if the trolley goes this way. */
  count: number;
  /** Emoji drawn on the track. */
  icon: string;
  /** True when the count is people (for the summary). */
  people?: boolean;
}

export interface Scenario {
  title: string;
  setup: string;
  /** Track the trolley takes if you do nothing. */
  stay: Track;
  /** Track the trolley takes if you pull the lever. */
  pull: Track;
}

export const SCENARIOS: Scenario[] = [
  {
    title: 'The Warm-Up',
    setup: 'A runaway trolley is rolling toward 5 people. Pull the lever and it swerves toward 1 person instead.',
    stay: { label: '5 people', count: 5, icon: '🧍', people: true },
    pull: { label: '1 person', count: 1, icon: '🧍', people: true },
  },
  {
    title: 'The Napping Cat',
    setup: 'A cat is having the best nap of its life on the tracks. The other track holds your 400 beloved houseplants.',
    stay: { label: '1 sleepy cat', count: 1, icon: '🐈' },
    pull: { label: '400 houseplants', count: 400, icon: '🪴' },
  },
  {
    title: 'The Pizza Debate',
    setup: 'Three people who love pineapple on pizza are on the main track. One person who yells about it is on the other.',
    stay: { label: '3 pineapple fans', count: 3, icon: '🍍', people: true },
    pull: { label: '1 loud pineapple hater', count: 1, icon: '📢', people: true },
  },
  {
    title: 'The Mime Convention',
    setup: 'Four mimes are stuck inside invisible boxes on the tracks. On the side track, a kazoo player will not stop playing.',
    stay: { label: '4 trapped mimes', count: 4, icon: '🤐', people: true },
    pull: { label: '1 kazoo player', count: 1, icon: '🎺', people: true },
  },
  {
    title: 'Your Future Self',
    setup: 'Two strangers are on the main track. On the side track is you, 30 years from now, giving a thumbs up.',
    stay: { label: '2 strangers', count: 2, icon: '🧍', people: true },
    pull: { label: 'Future you', count: 1, icon: '👍', people: true },
  },
  {
    title: 'The Photo Album',
    setup: 'One person is on the main track. The side track holds the only copy of every photo you have ever taken.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: 'Every photo you own', count: 1, icon: '📸' },
  },
  {
    title: 'The Feelings Robots',
    setup: 'Five robots insist they have feelings. On the other track sits a toaster that definitely does not.',
    stay: { label: '5 emotional robots', count: 5, icon: '🤖' },
    pull: { label: '1 regular toaster', count: 1, icon: '🍞' },
  },
  {
    title: 'The Time Loop',
    setup: 'The person on the main track says this happens every day and they will be back tomorrow. The person on the side track is new here.',
    stay: { label: '1 time-looper', count: 1, icon: '🔁', people: true },
    pull: { label: '1 newcomer', count: 1, icon: '🧍', people: true },
  },
  {
    title: 'The Snowman',
    setup: 'A child spent all day building a perfect snowman on the tracks. The side track runs through a giant puddle next to 10 people in nice clothes.',
    stay: { label: '1 perfect snowman', count: 1, icon: '⛄' },
    pull: { label: '10 people splashed', count: 10, icon: '💦', people: true },
  },
  {
    title: 'The Briefcase',
    setup: 'One person is on the main track. A briefcase holding one million dollars, which belongs to you, is on the side track.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: 'Your $1,000,000', count: 1, icon: '💼' },
  },
  {
    title: 'The Dentist Twins',
    setup: 'Your dentist is on the main track. On the side track is your dentist\'s identical twin, who has never seen a tooth up close.',
    stay: { label: 'Your dentist', count: 1, icon: '🦷', people: true },
    pull: { label: 'The twin', count: 1, icon: '🧍', people: true },
  },
  {
    title: 'The Spoiler',
    setup: 'Three people are on the main track. One person on the side track is about to tell you how your favorite show ends.',
    stay: { label: '3 people', count: 3, icon: '🧍', people: true },
    pull: { label: '1 spoiler', count: 1, icon: '🗣️', people: true },
  },
  {
    title: 'The Lobster Escape',
    setup: 'Six lobsters escaped a restaurant tank and wandered onto the tracks. The chef chasing them is on the side track.',
    stay: { label: '6 lobsters', count: 6, icon: '🦞' },
    pull: { label: '1 chef', count: 1, icon: '👨‍🍳', people: true },
  },
  {
    title: 'Ducks in a Row',
    setup: 'Eight ducks are standing in a perfectly straight row. Eight more ducks are in a messy pile on the side track.',
    stay: { label: '8 tidy ducks', count: 8, icon: '🦆' },
    pull: { label: '8 messy ducks', count: 8, icon: '🦆' },
  },
  {
    title: 'The Antique Trolley',
    setup: 'Two people are on the main track. Pull the lever and the trolley, a priceless antique, rolls into a lake instead.',
    stay: { label: '2 people', count: 2, icon: '🧍', people: true },
    pull: { label: 'The priceless trolley', count: 1, icon: '🌊' },
  },
  {
    title: 'The Sticky Lever',
    setup: 'One person on each track. The lever is covered in a mystery goo that smells a little like soup.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: '1 person (and goo hands)', count: 1, icon: '🥣', people: true },
  },
  {
    title: 'The Copies',
    setup: 'Five people are on the main track. Five exact copies of those same five people are on the side track.',
    stay: { label: '5 originals', count: 5, icon: '🧍', people: true },
    pull: { label: '5 copies', count: 5, icon: '👯', people: true },
  },
  {
    title: 'The Perfect Sandwich',
    setup: 'One person is on the main track. The side track holds the best sandwich you will ever eat, and it has your name on it.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: 'The perfect sandwich', count: 1, icon: '🥪' },
  },
  {
    title: 'The Question Asker',
    setup: 'A professor who keeps asking you trolley questions is on the main track. Two students who skipped class are on the side track.',
    stay: { label: '1 professor', count: 1, icon: '🧑‍🏫', people: true },
    pull: { label: '2 skippers', count: 2, icon: '🎒', people: true },
  },
  {
    title: 'The Alarm Clocks',
    setup: 'One person is on the main track. Every alarm clock in the world is piled on the side track. Nobody would ever wake up on time again.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: 'Every alarm clock', count: 1, icon: '⏰' },
  },
  {
    title: 'The Bee Problem',
    setup: 'A beekeeper is on the main track. Ten thousand bees are on the side track. They are very small, but there are a lot of them.',
    stay: { label: '1 beekeeper', count: 1, icon: '🧑‍🌾', people: true },
    pull: { label: '10,000 bees', count: 10000, icon: '🐝' },
  },
  {
    title: 'The Router',
    setup: 'Two people are on the main track. The side track holds the router for the whole town. No Wi-Fi for a week.',
    stay: { label: '2 people', count: 2, icon: '🧍', people: true },
    pull: { label: 'The town router', count: 1, icon: '📶' },
  },
  {
    title: 'The Inspector',
    setup: 'Five people are on the main track. On the side track, a safety inspector is checking whether the lever works.',
    stay: { label: '5 people', count: 5, icon: '🧍', people: true },
    pull: { label: '1 inspector', count: 1, icon: '📋', people: true },
  },
  {
    title: 'The Genie',
    setup: 'Three people are on the main track. A magic lamp with three unused wishes is on the side track.',
    stay: { label: '3 people', count: 3, icon: '🧍', people: true },
    pull: { label: '1 magic lamp', count: 1, icon: '🪔' },
  },
  {
    title: 'The Fresh Sheets',
    setup: 'One person is on the main track. Your bed, freshly made with warm sheets straight from the dryer, is on the side track.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: 'Your cozy bed', count: 1, icon: '🛏️' },
  },
  {
    title: 'The Secret Recipe',
    setup: 'Four people are on the main track. The last copy of your grandma\'s famous cookie recipe is on the side track.',
    stay: { label: '4 people', count: 4, icon: '🧍', people: true },
    pull: { label: "Grandma's recipe", count: 1, icon: '🍪' },
  },
  {
    title: 'The Pass-Along',
    setup: 'One person is on the main track. The side track is empty, but it leads to a different trolley problem that someone else has to solve.',
    stay: { label: '1 person', count: 1, icon: '🧍', people: true },
    pull: { label: "Someone else's problem", count: 0, icon: '🤷' },
  },
  {
    title: 'The Happy Ending',
    setup: 'Five people are on the main track. The side track leads straight into a trolley museum, where the trolley can retire in peace.',
    stay: { label: '5 people', count: 5, icon: '🧍', people: true },
    pull: { label: 'A cozy museum', count: 0, icon: '🏛️' },
  },
];
