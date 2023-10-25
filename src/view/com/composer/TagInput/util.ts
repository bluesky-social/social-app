import {
  HASHTAG_INVALID_CHARACTER_REGEX,
  LEADING_PUNCTUATION_REGEX,
  LEADING_NUMBER_REGEX,
  LEADING_HASH_REGEX,
} from '@atproto/api'

/**
 * Basically `sanitizeHashtag` from `@atproto/api`, but ignores trailing
 * punctuation in case the user intends to use `_` or `-`.
 */
export function sanitizeHashtagOnChange(hashtag: string) {
  return hashtag
    .replace(LEADING_HASH_REGEX, '')
    .replace(LEADING_NUMBER_REGEX, '')
    .replace(LEADING_PUNCTUATION_REGEX, '')
    .replace(HASHTAG_INVALID_CHARACTER_REGEX, '')
    .slice(0, 64)
}
