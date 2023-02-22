export function pluralize(n: number, base: string, plural?: string): string {
  if (n === 1) {
    return base
  }
  if (plural) {
    return plural
  }
  return base + 's'
}

export function enforceLen(str: string, len: number, ellipsis = false): string {
  str = str || ''
  if (str.length > len) {
    return str.slice(0, len) + (ellipsis ? '...' : '')
  }
  return str
}
