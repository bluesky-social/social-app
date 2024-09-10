import {TAG_REGEX, TRAILING_PUNCTUATION_REGEX} from '@atproto/api'
import {findSuggestionMatch as defaultFindSuggestionMatch} from '@tiptap/suggestion'

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
 *
 * @see https://github.com/ueberdosis/tiptap/blob/cf2067906f506486c6613f872be8b1fd318526c9/packages/suggestion/src/findSuggestionMatch.ts
 */
export function findSuggestionMatch({
  $position,
}: Parameters<typeof defaultFindSuggestionMatch>[0]) {
  const text = $position.nodeBefore?.isText && $position.nodeBefore.text

  if (!text) {
    return null
  }

  const textFrom = $position.pos - text.length
  const match = Array.from(text.matchAll(TAG_REGEX)).pop()

  if (!match || match.input === undefined || match.index === undefined) {
    return null
  }

  const [fullMatch, , tag] = match

  if (!tag || tag.length === 0 || tag.length > 64) return null

  const leadingSpaceOffset = fullMatch.startsWith(' ') ? 1 : 0
  const hashtagOffset = 1

  // The absolute position of the match in the document
  const from = textFrom + match.index + leadingSpaceOffset
  const to = from + tag.length + hashtagOffset

  // If the $position is located within the matched substring, return that range
  if (from < $position.pos && to >= $position.pos) {
    return {
      range: {
        from,
        to,
      },
      query: tag.replace(TRAILING_PUNCTUATION_REGEX, ''),
      text: fullMatch.replace(/^\s{1}/, ''),
    }
  }

  return null
}
