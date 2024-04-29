import {AppBskyEmbedRecord, AppBskyRichtextFacet} from '@atproto/api'

export interface Message {
  id: string
  text: string
  facets?: AppBskyRichtextFacet.Main[]
  embed?: AppBskyEmbedRecord.Main | {$type: string; [k: string]: unknown}
  [k: string]: unknown
}

export const placeholderClops = [
  'When horses clip-clop in sync, is it considered a hoofbeat remix?',
  'Ever heard a horse go clip-clop in flip flops?',
  'Clip clop! That’s just my horse tap-dancing in the kitchen.',
  'Why did the horse clip-clop into the bar? Because it couldn’t find the neigh-borhood pub!',
  "A horse's clip-clop is just their way of laying down a sick beat.",
  'Is it still clip-clop if the horse is wearing sneakers?',
  "If a horse clip-clops in the forest and no one's around, does it still make a sound?",
  "I told my horse to stop the clip-clop but he just wouldn't hoof it!",
  "The horse's clip-clop was so loud, it started its own podcast!",
  'Clip clop goes the horse, trotting into the comedy club for open mic night.',
  'Do horses practice clip-clopping, or are they just naturally that cloggy?',
  'When the horse clip-clops backwards, is it called clop-clip?',
  "A horse walks into a cafe. The barista says, 'Why the loud clip-clop?' The horse says, 'I like my coffee hoof-brewed.'",
  "I asked the horse why it clip-clops, and it said, 'To keep my hooves in clop-top shape!'",
  'Clip-clop in the streets, neigh in the sheets.',
  'Horses clip-clop to keep their hooves from going clippity-flop.',
  "Clip clop, clip clop, that's just my horse walking in stilettos.",
  'Did the horse clip-clop over the bridge because it wanted to stirrup some trouble?',
  'If a unicorn clip-clops, does it sound like a sparkle?',
  'When a horse clip-clops on a tiled floor, is it just practicing for its moonwalk audition?',
  "A horse's clip-clop is just prehistoric tap dancing.",
  'Clip clop? More like hip hop when my horse starts dancing!',
  "Who needs a metronome when you have a horse's clip-clop?",
  'Clip-clop chaos: when multiple horses decide to start a flash mob.',
  'The only thing my horse clip-clops for is a hoof-full of treats.',
  'If a horse could DJ, would it remix the clip-clop?',
  'What do you call a horse that can clip-clop and whistle? A multi-talented showoff!',
  'Why do horses clip-clop? Because galloping is just too mainstream.',
  'Every horse’s clip-clop is just a step away from a full-blown musical.',
  'Can a horse clip-clop on water? Only if it doesn’t want to get its hooves wet.',
  'Clip clop, clip clop, is that a horse or someone in high heels?',
  'The only clip-clop my horse does is when he’s late for dinner.',
  "Clip clop goes the horse, sounding like he's got a new pair of boots.",
  'When a knight’s horse clip-clops, is it just medieval rock music?',
  'If a horse could talk, it would probably complain about the clip-clop stereotype.',
  "Clip clop is just the horse’s way of saying, 'I’m walking here!'",
  "When the horse heard clip-clop, it thought, 'Hey, that’s my line!'",
  'Can a horse do a clip-clop remix with a cowbell for extra flair?',
  'Why did the horse clip-clop to the beat? Because it had rhythm in its hooves!',
  'Is it really clip-clop if the horse is just trying to sneak into the kitchen?',
  "A horse clip-clops into a grocery store: 'I’m just here for the carrots.'",
  'If a horse clip-clops in slippers, does it make a sound?',
  'The horse’s clip-clop was louder than my last concert.',
  'Clip-clop or not, my horse prefers to moonwalk.',
  'Horses that clip-clop are just trying to keep the beat alive.',
  'When you hear clip-clop, remember, it might just be a horse in disguise.',
  'What’s louder: a horse’s clip-clop or my dad’s snoring?',
  'Clip-clop: the original horse-powered beat.',
  'Do zebras clip-clop, or is it more of a zebra-crossing sound?',
  "Clip-clop is just horse for 'where's my hay?'",
]
