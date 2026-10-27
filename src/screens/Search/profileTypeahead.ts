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

const ACCOUNT_OPERATOR_RE = /^(from|to|mentions):@?([\p{L}\p{N}._-]*)$/u

function isSearchOperator(token: string): boolean {
  const match = /^-?([a-z]+):/i.exec(token)
  return !!match && SEARCH_OPERATORS.has(match[1].toLowerCase())
}

/**
 * Finds an account operator being typed at the end of the query. A trailing
 * space ends completion; `me` is reserved for the viewer.
 */
export function getTrailingAccountOperator(query: string) {
  if (/\s$/u.test(query)) return undefined
  const token = tokenizeQuery(query).at(-1)
  if (!token) return undefined
  const match = ACCOUNT_OPERATOR_RE.exec(token)
  if (!match || match[2] === 'me') return undefined
  return {operator: match[1], value: match[2]}
}

/**
 * Completes the trailing account operator with a handle and a space.
 */
export function completeTrailingAccount(query: string, handle: string): string {
  const accountOperator = getTrailingAccountOperator(query)
  if (!accountOperator) return query
  const token = tokenizeQuery(query).at(-1) ?? ''
  return `${query.slice(0, query.length - token.length)}${accountOperator.operator}:${handle} `
}

/**
 * Looks up a trailing account value or removes post search operators,
 * preserving the original query when no operators are removed.
 */
export function getProfileTypeaheadQuery(query: string): string {
  const accountOperator = getTrailingAccountOperator(query)
  if (accountOperator) return accountOperator.value
  const tokens = tokenizeQuery(query)
  const kept = tokens.filter(token => !isSearchOperator(token))
  return kept.length === tokens.length ? query : kept.join(' ')
}
