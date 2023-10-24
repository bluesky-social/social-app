export function sanitize(tagString: string) {
  return tagString
    .trim()
    .replace(LEADING_HASH_REGEX, '')
    .replace(ENDING_PUNCTUATION_REGEX, '')
}
