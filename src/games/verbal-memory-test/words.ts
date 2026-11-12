// Common, family-friendly English words. Duplicates are removed at load, so order doesn't matter.
const RAW = `
apple anchor angle ankle answer ant apron arrow attic autumn
baby bacon badge bagel bakery ball balloon banana band banjo
barn basket bat beach beak bean bear beard bed bee
beetle bell belt bench berry bicycle bird blanket blender blossom
boat bone book boot bottle bowl box bracelet branch bread
brick bridge broom brush bubble bucket bug bunny bus butter
button cabin cable cactus cake camel camera candle candy canoe
canyon cap car card carpet carrot castle cat cave ceiling
chain chair chalk cheese cherry chess chicken chimney chin circle
city clam cliff clock cloud clover clown coat coconut coffee
coin comet compass cookie corn couch cousin cow crab crayon
cricket crown cup cupboard curtain cushion daisy dance desert desk
diamond dice dinner dinosaur dog doll dolphin donkey door dragon
drawer dream dress drum duck dust eagle ear earth egg
elbow elephant engine envelope eraser eye fabric face fair farm
feather fence fern field finger fire fish flag flame flute
fog folder forest fork fountain fox frog fruit garden garlic
gate gem ghost giant gift giraffe glass glove glue goat
gold goose grape grass gravel guitar hair hammer hammock hand
harbor harp hat hawk heart helmet hill hippo hive honey
hook horn horse hose hotel house island jacket jam jar
jelly jet jewel juice kangaroo kettle key king kite kitten
knee knife knot ladder ladle lake lamp lantern leaf lemon
letter lettuce library lid lighthouse lily lion lizard lobster lock
log lunch magnet mail mango map marble market mask meadow
melon mermaid metal meteor milk mirror mitten mole monkey moon
moose moth mountain mouse muffin mug mushroom music nail napkin
necklace needle nest net noodle nose notebook nut oak oar
ocean octopus office olive onion orange orchard otter oven owl
paddle page paint pajamas palace pan panda paper parade parrot
party pasta peach peanut pear pebble pencil penguin pepper piano
pickle picnic pie pig pillow pilot pine pirate pizza planet
plate pocket poem pond popcorn potato puddle pumpkin puppet puppy
puzzle quilt rabbit raccoon radio rain rainbow rake river road
robot rock rocket roof rope rose ruler sail salad salt
sand sandal saucer scarf school scissors seal seed shadow shark
sheep shelf shell ship shirt shoe shovel sink skate skirt
sky sled slipper snail snake snow soap sock sofa soup
spider spoon squirrel stamp star station statue stick stone storm
stove straw stream street sugar suitcase sun sunflower swan sweater
swing table tail teacher teapot tent thimble thread throne thumb
ticket tiger toast toe tomato tooth torch tower town toy
tractor train treasure tree truck trumpet tulip tunnel turtle umbrella
valley vase velvet violin volcano wagon wall wallet walnut walrus
wand water wave whale wheel whistle window wing winter wizard
wolf wool worm yarn yogurt zebra zipper
brave calm clever cozy curly dizzy eager fancy fluffy fuzzy
gentle giggle glow grumpy happy humble jolly lucky mighty noisy
polite proud quiet rapid shiny silly sleepy smooth sneaky soft
sparkle sticky sunny swift tiny wobbly zany bounce climb dive
float gallop hop juggle laugh paddle skip splash tumble wander
whisper wiggle yawn zoom borrow bake build carry chase gather
`;

export const WORDS: string[] = [...new Set(RAW.split(/\s+/).filter(Boolean))];
