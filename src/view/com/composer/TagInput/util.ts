import {
  HASHTAG_INVALID_CHARACTER_REGEX,
  TRAILING_PUNCTUATION_REGEX,
  LEADING_PUNCTUATION_REGEX,
  LEADING_NUMBER_REGEX,
} from '@atproto/api'

/**
 * Trims leading numbers, all invalid characters, and any trailing punctuation.
 */
export function sanitizeHashtag(hashtag: string) {
  return hashtag
    .replace(LEADING_PUNCTUATION_REGEX, '')
    .replace(LEADING_NUMBER_REGEX, '')
    .replace(HASHTAG_INVALID_CHARACTER_REGEX, '')
    .replace(TRAILING_PUNCTUATION_REGEX, '')
}

/**
 * Trims leading numbers and all invalid charactes, but ignores trailing
 * punctuation in case the user intends to use `_` or `-`.
 */
export function sanitizeHashtagOnChange(hashtag: string) {
  return hashtag
    .replace(LEADING_PUNCTUATION_REGEX, '')
    .replace(LEADING_NUMBER_REGEX, '')
    .replace(HASHTAG_INVALID_CHARACTER_REGEX, '')
}
