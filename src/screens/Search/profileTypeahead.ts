import {tokenizeQuery} from '#/state/queries/search-posts-params'

/**
 * Post search operators. Their values name a filter, not an account, so they
 * are left out of the profile typeahead lookup.
 */
const SEARCH_OPERATORS = new Set([
  'from',
  'to',
  'mentions',
  'domain',
  'url',
  'lang',
  'since',
  'until',
])

function isSearchOperator(token: string): boolean {
  const match = /^-?([a-z]+):/i.exec(token)
  return !!match && SEARCH_OPERATORS.has(match[1].toLowerCase())
}

/**
 * The text to look up in the profile typeahead for a search query, which is
 * the query minus any search operators. The typeahead matches on display
 * names too, so sending `from:me cats` as-is suggests accounts with "from:me"
 * in their name, and a half-typed `from:alice-b` matches popular accounts on
 * the "b" alone.
 */
export function getProfileTypeaheadQuery(query: string): string {
  const tokens = tokenizeQuery(query)
  const kept = tokens.filter(token => !isSearchOperator(token))
  return kept.length === tokens.length ? query : kept.join(' ')
}
