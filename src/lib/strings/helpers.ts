import {useCallback, useMemo} from 'react'
import Graphemer from 'graphemer'

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

export function useEnforceMaxGraphemeCount() {
  const splitter = useMemo(() => new Graphemer(), [])

  return useCallback(
    (text: string, maxCount: number) => {
      if (splitter.countGraphemes(text) > maxCount) {
        return splitter.splitGraphemes(text).slice(0, maxCount).join('')
      } else {
        return text
      }
    },
    [splitter],
  )
}

export function useWarnMaxGraphemeCount({
  text,
  maxCount,
}: {
  text: string
  maxCount: number
}) {
  const splitter = useMemo(() => new Graphemer(), [])

  return useMemo(() => {
    return splitter.countGraphemes(text) > maxCount
  }, [splitter, maxCount, text])
}

export function countLines(str: string | undefined): number {
  if (!str) return 0
  return str.match(/\n/g)?.length ?? 0
}

// Augments search query with additional syntax like `from:me`
export function augmentSearchQuery(query: string, {did}: {did?: string}) {
  // Don't do anything if there's no DID
  if (!did) {
    return query
  }

  // We don't want to replace substrings that are being "quoted" because those
  // are exact string matches, so what we'll do here is to split them apart

  // Even-indexed strings are unquoted, odd-indexed strings are quoted
  const splits = query.split(/("(?:[^"\\]|\\.)*")/g)

  return splits
    .map((str, idx) => {
      if (idx % 2 === 0) {
        return str.replaceAll(/(^|\s)from:me(\s|$)/g, `$1${did}$2`)
      }

      return str
    })
    .join('')
}
