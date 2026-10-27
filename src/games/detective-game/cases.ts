// Original mini mysteries. Every case is built so the clues knock the suspects down 4 → 3 → 2 → 1,
// and each clue's rule matches what the player can see in the portraits or read in the suspects' quotes.

export type Hat = 'none' | 'cap' | 'beanie' | 'tophat' | 'chef' | 'bow';
export type Hair = 'short' | 'long' | 'curly' | 'bun' | 'bald';
export type HairColor = 'black' | 'brown' | 'blonde' | 'red' | 'gray';
export type Shirt = 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
export type Pattern = 'plain' | 'stripes' | 'dots';

export interface Look {
  skin: 0 | 1 | 2 | 3;
  hair: Hair;
  hairColor: HairColor;
  hat: Hat;
  glasses: boolean;
  mustache: boolean;
  shirt: Shirt;
  pattern: Pattern;
}

export interface Suspect {
  name: string;
  look: Look;
  says: string;
  /** Facts the player learns from the quote, e.g. { where: 'inside' }. */
  facts?: Record<string, string>;
}

/** A clue keeps the suspects whose look or facts value equals `is` (or differs from `not`). */
export interface Clue {
  text: string;
  key: string;
  is?: string | boolean;
  not?: string | boolean;
}

export interface Case {
  id: string;
  title: string;
  scene: string;
  suspects: [Suspect, Suspect, Suspect, Suspect];
  clues: [Clue, Clue, Clue];
  culprit: number;
  reveal: string;
}

export function fits(s: Suspect, c: Clue): boolean {
  const v = (s.look as unknown as Record<string, unknown>)[c.key] ?? s.facts?.[c.key];
  return c.is !== undefined ? v === c.is : v !== c.not;
}

export const CASES: Case[] = [
  {
    id: 'cake',
    title: 'The Last Slice of Cake',
    scene:
      'Everyone went to the garden to sing for Grandma. When they came back, the last slice of chocolate cake was gone. Only crumbs were left behind.',
    suspects: [
      {
        name: 'Uncle Ned',
        look: { skin: 1, hair: 'short', hairColor: 'brown', hat: 'cap', glasses: false, mustache: true, shirt: 'blue', pattern: 'plain' },
        says: 'I was blowing up balloons the whole time. I am still dizzy.',
      },
      {
        name: 'Cousin Tilly',
        look: { skin: 0, hair: 'long', hairColor: 'red', hat: 'bow', glasses: true, mustache: false, shirt: 'pink', pattern: 'dots' },
        says: 'I do not even like chocolate. Well, not that much.',
      },
      {
        name: 'Grandpa Mo',
        look: { skin: 3, hair: 'bald', hairColor: 'gray', hat: 'none', glasses: true, mustache: true, shirt: 'green', pattern: 'stripes' },
        says: 'I was asleep in my comfy chair. Probably.',
      },
      {
        name: 'Aunt June',
        look: { skin: 2, hair: 'curly', hairColor: 'black', hat: 'none', glasses: true, mustache: false, shirt: 'yellow', pattern: 'stripes' },
        says: 'I was guarding the presents. Somebody had to.',
      },
    ],
    clues: [
      { text: 'A crumb trail ends at someone with frosting smeared on their glasses.', key: 'glasses', is: true },
      { text: 'A thread stuck to the cake plate came from a striped shirt.', key: 'pattern', is: 'stripes' },
      { text: 'A single hair was found stuck in the leftover frosting.', key: 'hair', not: 'bald' },
    ],
    culprit: 3,
    reveal: 'Aunt June was guarding the presents, and the cake, and then the cake was inside Aunt June.',
  },
  {
    id: 'hamster',
    title: 'The Great Hamster Escape',
    scene:
      'Professor Nibbles, the class hamster, is loose! Someone opened his cage at lunchtime. He was last seen heading for the art supplies.',
    suspects: [
      {
        name: 'Ms. Pickett',
        look: { skin: 1, hair: 'bun', hairColor: 'gray', hat: 'none', glasses: true, mustache: false, shirt: 'purple', pattern: 'plain' },
        says: 'I stayed inside at my desk, grading spelling tests. I am the teacher, after all.',
        facts: { where: 'inside', role: 'adult' },
      },
      {
        name: 'Leo',
        look: { skin: 2, hair: 'short', hairColor: 'black', hat: 'cap', glasses: false, mustache: false, shirt: 'red', pattern: 'stripes' },
        says: 'I was outside on the playground, playing tag. I was "it" for ages.',
        facts: { where: 'outside', role: 'kid' },
      },
      {
        name: 'Ava',
        look: { skin: 0, hair: 'long', hairColor: 'blonde', hat: 'none', glasses: false, mustache: false, shirt: 'green', pattern: 'dots' },
        says: 'I stayed inside to feed the fish. They looked hungry.',
        facts: { where: 'inside', role: 'kid' },
      },
      {
        name: 'Sam',
        look: { skin: 3, hair: 'curly', hairColor: 'brown', hat: 'beanie', glasses: true, mustache: false, shirt: 'blue', pattern: 'plain' },
        says: 'I stayed inside reading a comic about space hamsters. Total coincidence.',
        facts: { where: 'inside', role: 'kid' },
      },
    ],
    clues: [
      { text: 'Nobody came in from the playground during lunch, so the culprit was inside.', key: 'where', is: 'inside' },
      { text: 'Sticky juice-box fingerprints on the latch mean it was one of the kids.', key: 'role', is: 'kid' },
      { text: 'A witness saw long hair swishing as the culprit tiptoed away.', key: 'hair', is: 'long' },
    ],
    culprit: 2,
    reveal: 'Ava fed the fish, then decided Professor Nibbles deserved a field trip. He was napping in her backpack.',
  },
  {
    id: 'bluecat',
    title: 'Who Painted the Cat Blue',
    scene:
      'Mr. Whiskers strolled in from the garden looking very calm and very, very blue. Four people were painting outside this afternoon.',
    suspects: [
      {
        name: 'Rosa',
        look: { skin: 2, hair: 'long', hairColor: 'black', hat: 'beanie', glasses: false, mustache: false, shirt: 'yellow', pattern: 'dots' },
        says: 'I was painting the fence brown. Plain old brown.',
        facts: { paint: 'brown' },
      },
      {
        name: 'Felix',
        look: { skin: 0, hair: 'short', hairColor: 'blonde', hat: 'cap', glasses: true, mustache: false, shirt: 'blue', pattern: 'stripes' },
        says: 'I was painting the doghouse sky blue. It looks great.',
        facts: { paint: 'blue' },
      },
      {
        name: 'Mr. Dunn',
        look: { skin: 1, hair: 'bald', hairColor: 'gray', hat: 'tophat', glasses: false, mustache: true, shirt: 'purple', pattern: 'plain' },
        says: 'I was painting my birdhouse a lovely shade of blue.',
        facts: { paint: 'blue' },
      },
      {
        name: 'Pip',
        look: { skin: 3, hair: 'curly', hairColor: 'red', hat: 'none', glasses: true, mustache: false, shirt: 'green', pattern: 'plain' },
        says: 'I was painting a picture of the blue sea. With a blue whale in it.',
        facts: { paint: 'blue' },
      },
    ],
    clues: [
      { text: 'The cat is covered in blue paint, so the culprit was using blue.', key: 'paint', is: 'blue' },
      { text: 'Tiny blue speckles were found on a pair of glasses left by the garden tap.', key: 'glasses', is: true },
      { text: 'The neighbor saw stripes moving behind the hedge.', key: 'pattern', is: 'stripes' },
    ],
    culprit: 1,
    reveal: 'Felix says the doghouse looked lonely without a matching cat. Mr. Whiskers seems fine with it.',
  },
  {
    id: 'chess',
    title: 'The Missing Chess King',
    scene:
      'The golden king from the chess club trophy has vanished from its glass case. The case was locked, and it is still locked.',
    suspects: [
      {
        name: 'Duke Penworth',
        look: { skin: 0, hair: 'short', hairColor: 'gray', hat: 'tophat', glasses: true, mustache: true, shirt: 'purple', pattern: 'stripes' },
        says: 'I am the chess club president. I was polishing the trophy case. Alone. As one does.',
        facts: { member: 'yes', alibi: 'none' },
      },
      {
        name: 'Nina',
        look: { skin: 2, hair: 'bun', hairColor: 'black', hat: 'none', glasses: false, mustache: false, shirt: 'red', pattern: 'plain' },
        says: 'I was playing chess with Otto at club practice. He never left the table.',
        facts: { member: 'yes', alibi: 'yes' },
      },
      {
        name: 'Otto',
        look: { skin: 1, hair: 'short', hairColor: 'brown', hat: 'cap', glasses: true, mustache: false, shirt: 'green', pattern: 'stripes' },
        says: 'I was playing chess with Nina. I was winning, for the record.',
        facts: { member: 'yes', alibi: 'yes' },
      },
      {
        name: 'Lady Fern',
        look: { skin: 3, hair: 'long', hairColor: 'blonde', hat: 'bow', glasses: false, mustache: false, shirt: 'pink', pattern: 'plain' },
        says: 'I was in the garden counting tulips. I am not in the chess club.',
        facts: { member: 'no', alibi: 'none' },
      },
    ],
    clues: [
      { text: 'The case was opened with a key, and only chess club members have one.', key: 'member', is: 'yes' },
      { text: 'A smear of shiny polish was found on a striped sleeve.', key: 'pattern', is: 'stripes' },
      { text: 'Nina and Otto were playing each other the whole time, so neither of them left the table.', key: 'alibi', is: 'none' },
    ],
    culprit: 0,
    reveal: 'Duke Penworth polished the king right into his top hat. He calls it "safekeeping."',
  },
  {
    id: 'cookies',
    title: 'The Empty Cookie Jar',
    scene:
      'The cookie jar lives on the very top shelf. This morning it was full. Tonight it is empty, and there is a chair nowhere near it.',
    suspects: [
      {
        name: 'Tiny Tom',
        look: { skin: 0, hair: 'curly', hairColor: 'blonde', hat: 'none', glasses: false, mustache: false, shirt: 'red', pattern: 'dots' },
        says: 'I cannot reach the top shelf. I am this tall. Look.',
        facts: { tall: 'no' },
      },
      {
        name: 'Chef Bertha',
        look: { skin: 2, hair: 'long', hairColor: 'brown', hat: 'chef', glasses: false, mustache: false, shirt: 'yellow', pattern: 'plain' },
        says: 'I am the cook, and I am tall enough to reach it. I count those cookies every night.',
        facts: { tall: 'yes' },
      },
      {
        name: 'Coach Rex',
        look: { skin: 3, hair: 'short', hairColor: 'black', hat: 'cap', glasses: false, mustache: true, shirt: 'blue', pattern: 'stripes' },
        says: 'I am the tallest person here, but cookies are not on my training plan.',
        facts: { tall: 'yes' },
      },
      {
        name: 'Grandpa Lou',
        look: { skin: 1, hair: 'bald', hairColor: 'gray', hat: 'beanie', glasses: true, mustache: true, shirt: 'green', pattern: 'dots' },
        says: 'I am tall, but I was napping in the living room all afternoon.',
        facts: { tall: 'yes' },
      },
    ],
    clues: [
      { text: 'Nobody used a chair, so the thief must be tall enough to reach the top shelf.', key: 'tall', is: 'yes' },
      { text: 'A crumb-covered mustache was spotted in the hallway mirror.', key: 'mustache', is: true },
      { text: 'Chocolate fingerprints were found on a polka-dot sleeve.', key: 'pattern', is: 'dots' },
    ],
    culprit: 3,
    reveal: 'Grandpa Lou\'s "nap" was a cookie picnic. Half the dots on his sweater turned out to be crumbs.',
  },
  {
    id: 'trophy',
    title: 'The Talent Show Trophy',
    scene:
      'Five minutes before the big finale, the talent show trophy disappeared from backstage. The show must go on, but the trophy must be found.',
    suspects: [
      {
        name: 'Magic Marvin',
        look: { skin: 1, hair: 'short', hairColor: 'black', hat: 'tophat', glasses: false, mustache: true, shirt: 'purple', pattern: 'stripes' },
        says: 'I was making a rabbit disappear. A different trick, I promise.',
      },
      {
        name: 'Dancing Daisy',
        look: { skin: 0, hair: 'bun', hairColor: 'red', hat: 'bow', glasses: false, mustache: false, shirt: 'pink', pattern: 'dots' },
        says: 'I was stretching backstage. Twirl, stretch, twirl.',
      },
      {
        name: 'Singing Sal',
        look: { skin: 3, hair: 'long', hairColor: 'brown', hat: 'none', glasses: true, mustache: false, shirt: 'yellow', pattern: 'plain' },
        says: 'I was warming up my voice in the hallway. La la laaa.',
      },
      {
        name: 'Juggling Joe',
        look: { skin: 2, hair: 'curly', hairColor: 'blonde', hat: 'cap', glasses: true, mustache: true, shirt: 'green', pattern: 'stripes' },
        says: 'I was juggling oranges. Three at once. Sometimes four.',
      },
    ],
    clues: [
      { text: 'The trophy is small enough to hide under a hat, and that is exactly where it went.', key: 'hat', not: 'none' },
      { text: 'A stagehand saw someone with a mustache sneaking past the curtain.', key: 'mustache', is: true },
      { text: 'In a backstage photo, the trophy reflects a pair of glasses.', key: 'glasses', is: true },
    ],
    culprit: 3,
    reveal: 'Juggling Joe wanted to try juggling the trophy. He dropped it straight into his own cap and panicked.',
  },
  {
    id: 'sofa',
    title: 'The Muddy Sofa',
    scene:
      'Someone bounced all over the brand-new white sofa in muddy shoes. The footprints are small and very, very fresh.',
    suspects: [
      {
        name: 'Max',
        look: { skin: 1, hair: 'short', hairColor: 'brown', hat: 'cap', glasses: false, mustache: false, shirt: 'red', pattern: 'stripes' },
        says: 'I was in the garden digging for worms. I found eleven.',
        facts: { outside: 'yes', role: 'kid' },
      },
      {
        name: 'Lily',
        look: { skin: 2, hair: 'long', hairColor: 'black', hat: 'none', glasses: true, mustache: false, shirt: 'blue', pattern: 'plain' },
        says: 'I was in the garden picking flowers for Mom.',
        facts: { outside: 'yes', role: 'kid' },
      },
      {
        name: 'Dad',
        look: { skin: 0, hair: 'short', hairColor: 'gray', hat: 'none', glasses: true, mustache: true, shirt: 'green', pattern: 'plain' },
        says: 'I was outside washing the car. It is still not clean.',
        facts: { outside: 'yes', role: 'adult' },
      },
      {
        name: 'Mom',
        look: { skin: 3, hair: 'bun', hairColor: 'brown', hat: 'none', glasses: false, mustache: false, shirt: 'purple', pattern: 'dots' },
        says: 'I was inside on my laptop all afternoon. My shoes are spotless.',
        facts: { outside: 'no', role: 'adult' },
      },
    ],
    clues: [
      { text: 'The mud is fresh garden mud, so the culprit was outside.', key: 'outside', is: 'yes' },
      { text: 'The footprints are tiny, so it was one of the kids.', key: 'role', is: 'kid' },
      { text: 'The neighbor saw a cap bouncing up and down through the window.', key: 'hat', is: 'cap' },
    ],
    culprit: 0,
    reveal: 'Max says he was "testing the sofa for worms." He did not find any. He did find trouble.',
  },
  {
    id: 'vase',
    title: 'The Broken Museum Vase',
    scene:
      'Crash! A very old vase is now a very old puzzle. Four people were in the vase room when it happened, and none of them saw anything. Supposedly.',
    suspects: [
      {
        name: 'Guard Gus',
        look: { skin: 3, hair: 'short', hairColor: 'black', hat: 'cap', glasses: false, mustache: true, shirt: 'blue', pattern: 'plain' },
        says: 'I was guarding the door. Guarding is my whole thing.',
      },
      {
        name: 'Professor Ada',
        look: { skin: 1, hair: 'bun', hairColor: 'gray', hat: 'none', glasses: true, mustache: false, shirt: 'purple', pattern: 'stripes' },
        says: 'I was studying the dinosaur bones next door. Fascinating creatures.',
      },
      {
        name: 'Tourist Tina',
        look: { skin: 0, hair: 'curly', hairColor: 'red', hat: 'bow', glasses: true, mustache: false, shirt: 'pink', pattern: 'stripes' },
        says: 'I was taking selfies with the mummy. He has a great smile.',
      },
      {
        name: 'Janitor Jo',
        look: { skin: 2, hair: 'long', hairColor: 'blonde', hat: 'beanie', glasses: false, mustache: false, shirt: 'green', pattern: 'stripes' },
        says: 'I was mopping. The floor is very slippery right now, just so you know.',
      },
    ],
    clues: [
      { text: 'A striped thread was caught on a piece of the vase.', key: 'pattern', is: 'stripes' },
      { text: 'The security camera caught a flash of light bouncing off a pair of glasses.', key: 'glasses', is: true },
      { text: 'The same camera shows a big bow on top of the culprit\'s head.', key: 'hat', is: 'bow' },
    ],
    culprit: 2,
    reveal: 'Tourist Tina stepped back for the perfect mummy selfie and bumped right into the vase. The selfie came out great, though.',
  },
  {
    id: 'pineapple',
    title: 'Who Put Pineapple on the Pizza',
    scene:
      'Pizza night! The order was plain cheese. But when the box was opened, the pizza was covered in pineapple. Someone has some explaining to do.',
    suspects: [
      {
        name: 'Chef Rocco',
        look: { skin: 1, hair: 'short', hairColor: 'black', hat: 'chef', glasses: false, mustache: true, shirt: 'red', pattern: 'plain' },
        says: 'I made a plain cheese pizza, as ordered. Pineapple on pizza? Never.',
        facts: { likes: 'no' },
      },
      {
        name: 'Kiki',
        look: { skin: 0, hair: 'long', hairColor: 'blonde', hat: 'none', glasses: true, mustache: false, shirt: 'yellow', pattern: 'dots' },
        says: 'Pineapple on pizza is the best. Not that I did anything.',
        facts: { likes: 'yes' },
      },
      {
        name: 'Uncle Hugo',
        look: { skin: 3, hair: 'bald', hairColor: 'brown', hat: 'cap', glasses: false, mustache: true, shirt: 'yellow', pattern: 'stripes' },
        says: 'I love pineapple. On pizza, in smoothies, on my cereal.',
        facts: { likes: 'yes' },
      },
      {
        name: 'Bea',
        look: { skin: 2, hair: 'curly', hairColor: 'brown', hat: 'beanie', glasses: true, mustache: false, shirt: 'blue', pattern: 'stripes' },
        says: 'I like pineapple on pizza, but I would never do it to someone else\'s pizza.',
        facts: { likes: 'yes' },
      },
    ],
    clues: [
      { text: 'Only someone who loves pineapple on pizza would do something this bold.', key: 'likes', is: 'yes' },
      { text: 'Sticky pineapple juice was found on a yellow sleeve.', key: 'shirt', is: 'yellow' },
      { text: 'Someone\'s glasses fogged up from the steam when they sneaked the box open.', key: 'glasses', is: true },
    ],
    culprit: 1,
    reveal: 'Kiki says she was "helping the pizza reach its full potential." Nobody agrees. Everybody had seconds.',
  },
  {
    id: 'snowman',
    title: 'The Snowman\'s Missing Nose',
    scene:
      'Mr. Frosty, the prize-winning snowman, has lost his carrot nose. The judges arrive in one hour. This is a snow emergency.',
    suspects: [
      {
        name: 'Farmer Jed',
        look: { skin: 1, hair: 'short', hairColor: 'brown', hat: 'cap', glasses: false, mustache: true, shirt: 'green', pattern: 'stripes' },
        says: 'I grow a thousand carrots. Why would I steal one?',
        facts: { role: 'adult' },
      },
      {
        name: 'Lola',
        look: { skin: 2, hair: 'long', hairColor: 'red', hat: 'beanie', glasses: false, mustache: false, shirt: 'purple', pattern: 'plain' },
        says: 'I built Mr. Frosty after school yesterday! I would never hurt him.',
        facts: { role: 'kid' },
      },
      {
        name: 'Hopper',
        look: { skin: 0, hair: 'curly', hairColor: 'black', hat: 'beanie', glasses: true, mustache: false, shirt: 'blue', pattern: 'dots' },
        says: 'My bunny, Clover, and I were sledding all morning. No school today!',
        facts: { role: 'kid' },
      },
      {
        name: 'Mrs. Kale',
        look: { skin: 3, hair: 'bun', hairColor: 'gray', hat: 'none', glasses: true, mustache: false, shirt: 'pink', pattern: 'dots' },
        says: 'I was knitting Mr. Frosty a scarf. It is nearly finished.',
        facts: { role: 'adult' },
      },
    ],
    clues: [
      { text: 'Woolly fuzz from a hat was found on the snowman\'s face.', key: 'hat', not: 'none' },
      { text: 'The boot prints around the snowman are tiny, so it was a kid.', key: 'role', is: 'kid' },
      { text: 'A carrot-shaped bump was spotted in a polka-dot pocket.', key: 'pattern', is: 'dots' },
    ],
    culprit: 2,
    reveal: 'Hopper took the nose for Clover the bunny, who says it was the best snack of the winter.',
  },
  {
    id: 'photo',
    title: 'The Doodled Class Photo',
    scene:
      'Someone drew silly green mustaches on every face in the class photo during recess. Even the goldfish got one.',
    suspects: [
      {
        name: 'Ollie',
        look: { skin: 0, hair: 'short', hairColor: 'blonde', hat: 'cap', glasses: true, mustache: false, shirt: 'red', pattern: 'stripes' },
        says: 'I only have a red marker. See? Just red.',
        facts: { green: 'no', role: 'kid' },
      },
      {
        name: 'Priya',
        look: { skin: 2, hair: 'long', hairColor: 'black', hat: 'none', glasses: true, mustache: false, shirt: 'green', pattern: 'plain' },
        says: 'I have a green marker, but I used it on my volcano project.',
        facts: { green: 'yes', role: 'kid' },
      },
      {
        name: 'Mr. Bloom',
        look: { skin: 3, hair: 'short', hairColor: 'brown', hat: 'beanie', glasses: false, mustache: true, shirt: 'purple', pattern: 'dots' },
        says: 'I am the art teacher, so of course I have a green marker. I have every color.',
        facts: { green: 'yes', role: 'adult' },
      },
      {
        name: 'Zoe',
        look: { skin: 1, hair: 'curly', hairColor: 'red', hat: 'bow', glasses: false, mustache: false, shirt: 'yellow', pattern: 'stripes' },
        says: 'I have a green marker too, but it is almost dried out.',
        facts: { green: 'yes', role: 'kid' },
      },
    ],
    clues: [
      { text: 'Every mustache was drawn in green marker.', key: 'green', is: 'yes' },
      { text: 'Only kids were in the classroom during recess.', key: 'role', is: 'kid' },
      { text: 'Green ink was smudged on a striped sleeve.', key: 'pattern', is: 'stripes' },
    ],
    culprit: 3,
    reveal: 'Zoe says the class photo "needed more personality." Her marker is now completely dried out.',
  },
  {
    id: 'icecream',
    title: 'The Midnight Freezer Raid',
    scene:
      'At exactly midnight, a whole tub of mint chocolate chip ice cream disappeared from the freezer. The empty tub was left in the sink.',
    suspects: [
      {
        name: 'Grandma Rose',
        look: { skin: 0, hair: 'bun', hairColor: 'gray', hat: 'none', glasses: true, mustache: false, shirt: 'pink', pattern: 'plain' },
        says: 'I was fast asleep by eight o\'clock. Like always.',
        facts: { awake: 'no' },
      },
      {
        name: 'Theo',
        look: { skin: 2, hair: 'short', hairColor: 'black', hat: 'beanie', glasses: false, mustache: false, shirt: 'blue', pattern: 'stripes' },
        says: 'I was up late playing video games. Headphones on. Heard nothing.',
        facts: { awake: 'yes' },
      },
      {
        name: 'Dad',
        look: { skin: 1, hair: 'short', hairColor: 'brown', hat: 'none', glasses: true, mustache: true, shirt: 'green', pattern: 'stripes' },
        says: 'I was up late watching a cooking show. Just watching.',
        facts: { awake: 'yes' },
      },
      {
        name: 'Aunt Ivy',
        look: { skin: 3, hair: 'long', hairColor: 'blonde', hat: 'none', glasses: false, mustache: false, shirt: 'purple', pattern: 'dots' },
        says: 'I was up late reading a mystery novel. Ironic, I know.',
        facts: { awake: 'yes' },
      },
    ],
    clues: [
      { text: 'The ice cream vanished at midnight, so the culprit was awake.', key: 'awake', is: 'yes' },
      { text: 'A drip of minty ice cream landed on a striped pajama top.', key: 'pattern', is: 'stripes' },
      { text: 'The spoon in the sink has a mustache-shaped smear of ice cream on it.', key: 'mustache', is: true },
    ],
    culprit: 2,
    reveal: 'Dad says the cooking show made him hungry. The show was about salad.',
  },
];
