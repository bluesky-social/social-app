import {
  HASHTAG_WITH_TRAILING_PUNCTUATION_REGEX,
  TRAILING_PUNCTUATION_REGEX,
  LEADING_HASH_REGEX,
} from '@atproto/api'

/**
 * This method eventually receives the `query` property from the result of
 * `findSuggestionMatch` below.
 */
export function parsePunctuationFromTag(value: string) {
  const reg = TRAILING_PUNCTUATION_REGEX
  const tag = value.replace(reg, '')
  const punctuation = value.match(reg)?.[0] || ''

  return {tag, punctuation}
}

/**
 * A result must be returned from this method in order for the suggestion
 * plugin to remain active and allow for the user to select a suggestion.
 *
 * That's why we use the loose regex form that includes trialing punctuation.
 * We strip that our later.
 */
export function findSuggestionMatch({
  text,
  cursorPosition,
}: {
  text: string
  cursorPosition: number
}) {
  const match = Array.from(
    text.matchAll(HASHTAG_WITH_TRAILING_PUNCTUATION_REGEX),
  ).pop()

  if (!match || match.input === undefined || match.index === undefined) {
    return null
  }

  const startIndex = cursorPosition - text.length
  let [matchedString, tagWithTrailingPunctuation] = match

  const sanitized = tagWithTrailingPunctuation
    .replace(TRAILING_PUNCTUATION_REGEX, '')
    .replace(LEADING_HASH_REGEX, '')

  // one of our hashtag spec rules
  if (sanitized.length > 64) return null

  const from =
    startIndex + match.index + matchedString.indexOf(tagWithTrailingPunctuation)
  const to = from + tagWithTrailingPunctuation.length

  if (from < cursorPosition && to >= cursorPosition) {
    return {
      range: {
        from,
        to,
      },
      /**
       * This is passed to the `items({ query })` method configured in
       * `createTagsAutocomplete`.
       *
       * We parse out the punctuation later.
       */
      query: tagWithTrailingPunctuation.replace(LEADING_HASH_REGEX, ''),
      // raw text string
      text: matchedString,
    }
  }

  return null
}
