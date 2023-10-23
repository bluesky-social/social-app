export const TAG_REGEX =
  /(?:^|\s)(#[\p{L}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Extended_Pictographic}]{1}[\p{L}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Extended_Pictographic}\d_-]*)/giu
export const LOOSE_TAG_REGEX =
  /(?:^|\s)(#[\p{L}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Extended_Pictographic}]{1}[\p{L}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Extended_Pictographic}\d_-]*\S*)/giu
export const ENDING_PUNCTUATION_REGEX = /\p{P}+$/gu
export const LEADING_HASH_REGEX = /^#/g

export function sanitize(tagString: string) {
  return tagString
    .trim()
    .replace(LEADING_HASH_REGEX, '')
    .replace(ENDING_PUNCTUATION_REGEX, '')
}
