import {
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiAlt_Stroke2_Corner0_Rounded as EmojiAlt,
  EmojiArc_Stroke2_Corner0_Rounded as EmojiArc,
  EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyes,
  emojiSmilePath,
  emojiSadPath,
  emojiAltPath,
  emojiArcPath,
  emojiHeartEyesPath,
} from '#/components/icons/Emoji'
import {
  Alien_Stroke2_Corner0_Rounded as Alien,
  path as alienPath,
} from '#/components/icons/Alien'
import {
  Bubbles_Stroke2_Corner0_Rounded as Bubbles,
  path as bubblesPath,
} from '#/components/icons/Bubbles'
import {
  Explosion_Stroke2_Corner0_Rounded as Explosion,
  path as explosionPath,
} from '#/components/icons/Explosion'
import {
  Lab_Stroke2_Corner0_Rounded as Lab,
  path as labPath,
} from '#/components/icons/Lab'
import {
  PiggyBank_Stroke2_Corner0_Rounded as PiggyBank,
  path as piggyBankPath,
} from '#/components/icons/PiggyBank'
import {
  Poop_Stroke2_Corner0_Rounded as Poop,
  path as poopPath,
} from '#/components/icons/Poop'

export const emojiNames = [
  'camera',
  'smile',
  'sad',
  'alt',
  'arc',
  'heartEyes',
  'alien',
  'bubbles',
  'explosion',
  'lab',
  'piggyBank',
  'poop',
] as const
export type EmojiName = (typeof emojiNames)[number]

export interface Emoji {
  name: EmojiName
  component: typeof EmojiSmile
  path: string
}
export const emojiItems: Record<EmojiName, Emoji> = {
  camera: {},
  smile: {
    name: 'smile',
    component: EmojiSmile,
    path: emojiSmilePath,
  },
  sad: {
    name: 'sad',
    component: EmojiSad,
    path: emojiSadPath,
  },
  alt: {
    name: 'alt',
    component: EmojiAlt,
    path: emojiAltPath,
  },
  arc: {
    name: 'arc',
    component: EmojiArc,
    path: emojiArcPath,
  },
  heartEyes: {
    name: 'heartEyes',
    component: EmojiHeartEyes,
    path: emojiHeartEyesPath,
  },
  alien: {
    name: 'alien',
    component: Alien,
    path: alienPath,
  },
  bubbles: {
    name: 'bubbles',
    component: Bubbles,
    path: bubblesPath,
  },
  explosion: {
    name: 'explosion',
    component: Explosion,
    path: explosionPath,
  },
  lab: {
    name: 'lab',
    component: Lab,
    path: labPath,
  },
  piggyBank: {
    name: 'piggyBank',
    component: PiggyBank,
    path: piggyBankPath,
  },
  poop: {
    name: 'poop',
    component: Poop,
    path: poopPath,
  },
}
