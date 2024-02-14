import {
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiAlt_Stroke2_Corner0_Rounded as EmojiAlt,
  EmojiArc_Stroke2_Corner0_Rounded as EmojiArc,
  EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyes,
} from '#/components/icons/Emoji'
import {Alien_Stroke2_Corner0_Rounded as Alien} from '#/components/icons/Alien'
import {Bubbles_Stroke2_Corner0_Rounded as Bubbles} from '#/components/icons/Bubbles'
import {Explosion_Stroke2_Corner0_Rounded as Explosion} from '#/components/icons/Explosion'
import {Lab_Stroke2_Corner0_Rounded as Lab} from '#/components/icons/Lab'
import {PiggyBank_Stroke2_Corner0_Rounded as PiggyBank} from '#/components/icons/PiggyBank'
import {Poop_Stroke2_Corner0_Rounded as Poop} from '#/components/icons/Poop'

export const emojis = [
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
export type Emoji = (typeof emojis)[number]
export const emojiItems: Record<Emoji, typeof EmojiSmile> = {
  smile: EmojiSmile,
  sad: EmojiSad,
  alt: EmojiAlt,
  arc: EmojiArc,
  heartEyes: EmojiHeartEyes,
  alien: Alien,
  bubbles: Bubbles,
  explosion: Explosion,
  lab: Lab,
  piggyBank: PiggyBank,
  poop: Poop,
}
