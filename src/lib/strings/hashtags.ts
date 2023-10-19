export const TAG_REGEX = /(?:^|\s)(#[^\d\s]\S*)(?=\s)?/gi
export const ENDING_PUNCTUATION_REGEX = /\p{P}+$/gu
export const LEADING_HASH_REGEX = /^#/

export function sanitize(tagString: string) {
  return tagString
    .trim()
    .replace(LEADING_HASH_REGEX, '')
    .replace(ENDING_PUNCTUATION_REGEX, '')
}
