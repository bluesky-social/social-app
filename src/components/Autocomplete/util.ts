/**
 * The typeahead backend splits a query on hyphens and matches any one piece,
 * so `alice-b` also returns popular accounts that only match `b`. A single
 * hyphenated word is almost always a handle being typed, so for one of those,
 * keep only profiles whose handle or display name contains the whole word.
 */
export function isWholeWordMatch(query: string) {
  const word = query.toLowerCase().trim().replace(/^@/, '')
  if (!word.includes('-') || /\s/.test(word)) return () => true
  return (profile: {handle: string; displayName?: string}) =>
    profile.handle.toLowerCase().includes(word) ||
    !!profile.displayName?.toLowerCase().includes(word)
}

export function parseAutocompleteItemType(type: string) {
  switch (type) {
    case 'mention':
      return 'profile'
    case 'tag':
      return 'tag'
    case 'emoji':
      return 'emoji'
    default:
      throw new Error(`Unknown autocomplete item type: ${type}`)
  }
}
