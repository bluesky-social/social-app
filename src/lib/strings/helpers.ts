export function pluralize(n: number, base: string, plural?: string): string {
  if (n === 1) {
    return base
  }
  if (plural) {
    return plural
  }
  return base + 's'
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

// https://stackoverflow.com/a/52171480
export function toHashCode(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function countLines(str: string | undefined): number {
  if (!str) return 0
  return str.match(/\n/g)?.length ?? 0
}

// Transforms search queries
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function transformSearchQuery(query: string) {
  // https://github.com/bluesky-social/indigo/blob/421e4da5307f4fcba51f25b5c5982c8b9841f7f6/search/parse_query.go#L15-L21
  let quoted = false
  const parts = fieldsfunc(query, rune => {
    if (rune === 34) {
      quoted = !quoted
    }

    return rune === 32 && !quoted
  })

  for (let i = 0, il = parts.length; i < il; i++) {
    const part = parts[i]

    if (part.charCodeAt(0) === 34) {
      continue
    }

    const colon_index = part.indexOf(':')
    if (colon_index === -1) {
      continue
    }

    const operator = part.slice(0, colon_index)
    const value = part.slice(colon_index + 1)

    if (operator === 'since' || operator === 'until') {
      const match = DATE_RE.exec(value)
      if (match === null) {
        continue
      }

      const s = operator === 'since'

      const [, year, month, day] = match
      const date = new Date(
        +year,
        +month - 1,
        +day,
        s ? 0 : 23,
        s ? 0 : 59,
        s ? 0 : 59,
        s ? 0 : 999,
      )

      if (Number.isNaN(date.getTime())) {
        continue
      }

      parts[i] = `${operator}:${date.toISOString()}`
    }
  }

  return parts.join(' ')
}

// https://github.com/golang/go/blob/519f6a00e4dabb871eadaefc8ac295c09fd9b56f/src/strings/strings.go#L377-L425
function fieldsfunc(str: string, fn: (rune: number) => boolean): string[] {
  const slices: string[] = []

  let start = -1
  for (let pos = 0, len = str.length; pos < len; pos++) {
    if (fn(str.charCodeAt(pos))) {
      if (start !== -1) {
        slices.push(str.slice(start, pos))
        start = -1
      }
    } else {
      if (start === -1) {
        start = pos
      }
    }
  }

  if (start !== -1) {
    slices.push(str.slice(start))
  }

  return slices
}
