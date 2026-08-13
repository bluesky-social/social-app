import {type RichText} from '@bsky.app/sdk/richtext'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {shortenLinks} from './rich-text-manip'

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
        return str.slice(0, len) + '…'
      } else if (mode === 'middle') {
        const half = Math.floor(len / 2)
        return str.slice(0, half) + '…' + str.slice(-half)
      } else {
        // fallback
        return str.slice(0, len)
      }
    } else {
      return str.slice(0, len)
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
