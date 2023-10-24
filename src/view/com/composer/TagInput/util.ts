import {TRAILING_PUNCTUATION_REGEX, LEADING_HASH_REGEX} from '@atproto/api'

export function sanitizeHashtag(tagString: string) {
  return tagString
    .trim()
    .replace(LEADING_HASH_REGEX, '')
    .replace(TRAILING_PUNCTUATION_REGEX, '')
}
