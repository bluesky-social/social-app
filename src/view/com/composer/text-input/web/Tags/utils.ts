import {
  TAG_REGEX,
  ENDING_PUNCTUATION_REGEX,
  LEADING_HASH_REGEX,
} from 'lib/strings/hashtags'

export function parsePunctuationFromTag(value: string) {
  const reg = ENDING_PUNCTUATION_REGEX
  const tag = value.replace(reg, '')
  const punctuation = value.match(reg)?.[0] || ''

  return {tag, punctuation}
}

export function findSuggestionMatch({
  text,
  cursorPosition,
}: {
  text: string
  cursorPosition: number
}) {
  const match = Array.from(text.matchAll(TAG_REGEX)).pop()

  if (!match || match.input === undefined || match.index === undefined) {
    return null
  }

  const startIndex = cursorPosition - text.length
  let [matchedString, tag] = match

  const sanitized = tag
    .replace(ENDING_PUNCTUATION_REGEX, '')
    .replace(LEADING_HASH_REGEX, '')

  // one of our hashtag spec rules
  if (sanitized.length > 64) return null

  const from = startIndex + match.index + matchedString.indexOf(tag)
  const to = from + tag.length

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
       * We parse out the punctuation later, but we don't want to pass
       * the # to the search query.
       */
      query: tag.replace(LEADING_HASH_REGEX, ''),
      // raw text string
      text: matchedString,
    }
  }

  return null
}
