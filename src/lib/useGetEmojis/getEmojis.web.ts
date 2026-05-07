import {type EmojiMartData} from '@emoji-mart/data'

export async function getEmojis(): Promise<EmojiMartData> {
  return (await import('@emoji-mart/data')).default as EmojiMartData
}
