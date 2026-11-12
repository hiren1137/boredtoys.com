// Things you meet on the way down, at typical or recorded depths in meters.
export interface Stop {
  id: string;
  name: string;
  depth: number;
  fact: string;
  /** Art width in px on desktop; mobile shrinks it. */
  size: number;
}

export const BOTTOM = 10935;

export const STOPS: Stop[] = [
  { id: 'boat', name: 'Ocean Surface', depth: 0, size: 120, fact: 'The ocean covers about 71% of Earth, and you are about to sink into it.' },
  { id: 'jelly', name: 'Moon Jellyfish', depth: 1, size: 64, fact: 'Moon jellyfish drift with the currents and get by without a brain, a heart or bones.' },
  { id: 'snorkel', name: 'Snorkeler', depth: 2, size: 96, fact: 'Snorkels stay short because water pressing on your chest makes breathing through a long tube too hard.' },
  { id: 'clownfish', name: 'Clownfish', depth: 5, size: 72, fact: 'Clownfish hide among stinging sea anemones, kept safe by a slimy coat on their skin.' },
  { id: 'seahorse', name: 'Seahorse', depth: 8, size: 50, fact: 'In seahorses, the dad carries the eggs in a pouch until the babies hatch.' },
  { id: 'star', name: 'Sea Star', depth: 10, size: 64, fact: 'Lost an arm? No problem. Many sea stars can grow a new one.' },
  { id: 'kelp', name: 'Giant Kelp', depth: 15, size: 64, fact: 'Giant kelp can grow about 60 cm in a single day.' },
  { id: 'turtle', name: 'Green Sea Turtle', depth: 20, size: 100, fact: 'A resting sea turtle can stay underwater for hours by slowing its heartbeat way down.' },
  { id: 'octopus', name: 'Octopus', depth: 25, size: 80, fact: 'An octopus has three hearts and blue blood.' },
  { id: 'manta', name: 'Manta Ray', depth: 30, size: 120, fact: "A giant manta ray's fins can stretch about 7 meters from tip to tip." },
  { id: 'scuba', name: 'Scuba Diver', depth: 40, size: 104, fact: 'Most recreational scuba divers are trained to stay above about 40 meters.' },
  { id: 'shark', name: 'Great White Shark', depth: 50, size: 130, fact: "Great white sharks can sense the tiny electric signals made by other animals' muscles." },
  { id: 'liberty', name: 'Statue of Liberty (for Scale)', depth: 93, size: 54, fact: 'From the ground to the tip of the torch, the Statue of Liberty is about 93 meters tall.' },
  { id: 'bluewhale', name: 'Blue Whale', depth: 100, size: 150, fact: 'The blue whale is the biggest animal known to have ever lived.' },
  { id: 'coelacanth', name: 'Coelacanth', depth: 180, size: 104, fact: 'Scientists thought coelacanths died out with the dinosaurs until a living one was found in 1938.' },
  { id: 'freediver', name: 'Freediving Record', depth: 214, size: 92, fact: 'In 2007 a freediver rode a weighted sled down to about 214 meters on a single breath.' },
  { id: 'dolphin', name: 'Bottlenose Dolphin', depth: 300, size: 116, fact: 'Trained bottlenose dolphins have dived to about 300 meters.' },
  { id: 'scubarecord', name: 'Deepest Scuba Dive', depth: 332, size: 92, fact: 'The deepest scuba dive on record reached about 332 meters in 2014. Getting back up safely took many hours.' },
  { id: 'nautilus', name: 'Chambered Nautilus', depth: 400, size: 76, fact: "A nautilus moves gas and liquid around its shell's chambers to float up or sink down." },
  { id: 'penguin', name: 'Emperor Penguin', depth: 500, size: 62, fact: 'Emperor penguins can dive deeper than 500 meters and hold their breath for over 20 minutes.' },
  { id: 'lanternfish', name: 'Lanternfish', depth: 600, size: 70, fact: 'Lanternfish swim up toward the surface every night to feed, then sink back down before sunrise.' },
  { id: 'barreleye', name: 'Barreleye', depth: 700, size: 92, fact: 'The barreleye has a see-through head, and its green eyes look up through it.' },
  { id: 'vampire', name: 'Vampire Squid', depth: 800, size: 80, fact: 'Despite the spooky name, the vampire squid eats drifting bits of "marine snow", not blood.' },
  { id: 'giantsquid', name: 'Giant Squid', depth: 900, size: 140, fact: 'Giant squid have eyes about as big as dinner plates, some of the largest of any animal.' },
  { id: 'goblin', name: 'Goblin Shark', depth: 1100, size: 124, fact: 'A goblin shark can shoot its jaws forward to snatch passing prey.' },
  { id: 'leatherback', name: 'Leatherback Turtle', depth: 1200, size: 104, fact: 'Leatherbacks are the deepest-diving sea turtles, recorded going past 1,000 meters.' },
  { id: 'isopod', name: 'Giant Isopod', depth: 1400, size: 80, fact: 'Giant isopods are cousins of the pill bugs in your garden, but they can grow longer than 30 cm.' },
  { id: 'seal', name: 'Elephant Seal', depth: 1550, size: 116, fact: 'Northern elephant seals can dive deeper than 1,500 meters to hunt.' },
  { id: 'angler', name: 'Anglerfish', depth: 1700, size: 92, fact: 'A female anglerfish dangles a glowing lure in front of her mouth to tempt prey closer.' },
  { id: 'sperm', name: 'Sperm Whale', depth: 2000, size: 150, fact: 'Sperm whales can hold their breath for over an hour while hunting squid in the dark.' },
  { id: 'gulper', name: 'Gulper Eel', depth: 2300, size: 116, fact: "The gulper eel can open its huge mouth like a pelican's pouch to scoop up food." },
  { id: 'vent', name: 'Hydrothermal Vent', depth: 2500, size: 84, fact: 'Vents blast out water hotter than 350 °C. The huge pressure keeps it from boiling.' },
  { id: 'tubeworm', name: 'Giant Tube Worms', depth: 2600, size: 84, fact: 'Giant tube worms can grow over 2 meters long, and they have no mouth or stomach.' },
  { id: 'beaked', name: "Cuvier's Beaked Whale", depth: 2992, size: 136, fact: "Cuvier's beaked whales hold the record for the deepest mammal dive, nearly 3,000 meters." },
  { id: 'dumbo', name: 'Dumbo Octopus', depth: 3200, size: 80, fact: 'Dumbo octopuses flap ear-like fins to swim, and they live deeper than any other known octopus.' },
  { id: 'average', name: 'Average Ocean Depth', depth: 3682, size: 70, fact: 'Averaged over the whole planet, the ocean is about 3,700 meters deep.' },
  { id: 'titanic', name: 'Titanic Wreck', depth: 3800, size: 140, fact: 'The wreck of the Titanic rests about 3,800 meters down in the North Atlantic.' },
  { id: 'seapig', name: 'Sea Pig', depth: 4500, size: 84, fact: 'Sea pigs are chubby sea cucumbers that walk across the seafloor on tube feet.' },
  { id: 'tripod', name: 'Tripod Fish', depth: 4800, size: 104, fact: 'The tripod fish props itself up on three long fin spikes and waits for food to drift by.' },
  { id: 'nodules', name: 'Manganese Nodules', depth: 5200, size: 96, fact: 'Lumps of metal called manganese nodules dot parts of the abyss. Some took millions of years to grow.' },
  { id: 'alvin', name: 'Research Submarine', depth: 6500, size: 116, fact: 'Alvin, a famous research submarine, can carry three people down to 6,500 meters.' },
  { id: 'amphipod', name: 'Supergiant Amphipod', depth: 7000, size: 92, fact: 'Supergiant amphipods are shrimp-like scavengers that can grow to about 30 cm in deep trenches.' },
  { id: 'snailfish', name: 'Hadal Snailfish', depth: 7700, size: 96, fact: 'Snailfish are soft, pale fish, and they live deeper than almost any other fish.' },
  { id: 'deepestfish', name: 'Deepest Fish Ever Filmed', depth: 8336, size: 90, fact: 'In 2022 a camera filmed a snailfish at about 8,336 meters, the deepest fish ever seen.' },
  { id: 'everest', name: 'Mount Everest (for Scale)', depth: 8849, size: 120, fact: 'Everest is 8,849 meters tall. Drop it in here and its peak would still be about 2 km underwater.' },
  { id: 'xeno', name: 'Xenophyophore', depth: 10600, size: 72, fact: 'Each one is a single cell, yet some grow wider than your hand, even in the deepest trenches.' },
  { id: 'challenger', name: 'Challenger Deep', depth: BOTTOM, size: 130, fact: 'The deepest known spot in the ocean. People first reached it in 1960, and the pressure here is over 1,000 times stronger than at the surface.' },
];

export interface Zone {
  name: string;
  depth: number;
  note: string;
}

export const ZONES: Zone[] = [
  { name: 'Sunlight Zone', depth: 0, note: 'Plenty of light for plants and algae' },
  { name: 'Twilight Zone', depth: 200, note: 'Too dim for plants to grow' },
  { name: 'Midnight Zone', depth: 1000, note: 'No sunlight at all from here down' },
  { name: 'Abyssal Zone', depth: 4000, note: 'Near freezing and pitch black' },
  { name: 'Hadal Zone', depth: 6000, note: 'Named after Hades, the Greek underworld' },
];
