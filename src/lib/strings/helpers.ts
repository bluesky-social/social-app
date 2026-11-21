import {type RichText} from '@bsky/sdk/richtext'
import {countGraphemes, splitGraphemes} from 'unicode-segmenter/grapheme'

import {shortenLinks} from './rich-text-manip'

/**
 * Takes at most `len` UTF-16 code units from the start of `str`, stopping at
 * the last whole grapheme cluster that fits.
 *
 * Slicing by code unit alone can cut an emoji in half. The leftover - a lone
 * surrogate, or a flag/ZWJ sequence missing its tail - renders as a
 * replacement character rather than as the emoji.
 */
function takeGraphemes(str: string, len: number): string {
  if (len <= 0) return ''
  let out = ''
  for (const grapheme of splitGraphemes(str)) {
    if (out.length + grapheme.length > len) break
    out += grapheme
  }
  return out
}

/**
 * Same as {@link takeGraphemes}, but takes from the end of the string.
 */
function takeGraphemesFromEnd(str: string, len: number): string {
  if (len <= 0) return ''
  const graphemes = [...splitGraphemes(str)]
  let out = ''
  for (let i = graphemes.length - 1; i >= 0; i--) {
    if (out.length + graphemes[i].length > len) break
    out = graphemes[i] + out
  }
  return out
}

export function enforceLen(
  str: string,
  len: number,
  ellipsis = false,
  mode: 'end' | 'middle' = 'end',
): string {
  str = str || ''
  if (str.length > len) {
    if (ellipsis) {
      if (mode === 'end') {
        return takeGraphemes(str, len) + '…'
      } else if (mode === 'middle') {
        const half = Math.floor(len / 2)
        return takeGraphemes(str, half) + '…' + takeGraphemesFromEnd(str, half)
      } else {
        // fallback
        return takeGraphemes(str, len)
      }
    } else {
      return takeGraphemes(str, len)
    }
  }
  return str
}

export function isOverMaxGraphemeCount({
  text,
  maxCount,
}: {
  text: string | RichText
  maxCount: number
}) {
  if (typeof text === 'string') {
    return countGraphemes(text) > maxCount
  } else {
    return shortenLinks(text).graphemeLength > maxCount
  }
}

export function countLines(str: string | undefined): number {
  if (!str) return 0
  return str.match(/\n/g)?.length ?? 0
}

/**
 * Normalizes a raw search query for the backend. The iOS keyboard inserts smart
 * quotes, but only straight quotes work for exact-phrase matching. Operators
 * like `from:me` are passed through untouched - the backend resolves `me` to
 * the viewer.
 */
export function augmentSearchQuery(query: string) {
  return query.replaceAll(/[“”]/g, '"')
}
