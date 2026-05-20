import Emojis, {type EmojiMartData} from '@emoji-mart/data'

export async function getEmojis(): Promise<EmojiMartData> {
  return Emojis as EmojiMartData
}
