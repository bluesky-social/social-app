import {tokenizeQuery} from '#/state/queries/search-posts-params'

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
 * Removes post search operators from profile lookups, preserving the original
 * query when no operators are removed.
 */
export function getProfileTypeaheadQuery(query: string): string {
  const tokens = tokenizeQuery(query)
  const kept = tokens.filter(token => !isSearchOperator(token))
  return kept.length === tokens.length ? query : kept.join(' ')
}
