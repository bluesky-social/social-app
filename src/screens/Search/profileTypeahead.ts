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

/**
 * A `from:` operator and the part of its value typed so far. Letters, digits,
 * `.`, `_` and `-` cover handles and most display names; anything else (a
 * quote, a paren) means the value isn't an account being typed.
 */
const FROM_OPERATOR_RE = /^from:@?([\p{L}\p{N}._-]*)$/u

function isSearchOperator(token: string): boolean {
  const match = /^-?([a-z]+):/i.exec(token)
  return !!match && SEARCH_OPERATORS.has(match[1].toLowerCase())
}

/**
 * The account a `from:` operator at the end of the query is still being typed
 * for, e.g. `ali` in `cats from:ali`. Undefined when the query doesn't end in
 * one, including after a trailing space and for `from:me`, which the backend
 * resolves to the viewer.
 */
export function getTrailingFromValue(query: string): string | undefined {
  if (/\s$/u.test(query)) return undefined
  const token = tokenizeQuery(query).at(-1)
  if (!token) return undefined
  const value = FROM_OPERATOR_RE.exec(token)?.[1]
  return value === 'me' ? undefined : value
}

/**
 * Replaces the value of the trailing `from:` operator with `handle`. Only
 * meaningful when `getTrailingFromValue` finds one. The trailing space ends
 * the operator, which closes its typeahead and lets the next term be typed
 * straight away.
 */
export function completeTrailingFrom(query: string, handle: string): string {
  const token = tokenizeQuery(query).at(-1) ?? ''
  return `${query.slice(0, query.length - token.length)}from:${handle} `
}

/**
 * Looks up a trailing `from:` value or removes post search operators, preserving
 * the original query when no operators are removed.
 */
export function getProfileTypeaheadQuery(query: string): string {
  const fromValue = getTrailingFromValue(query)
  if (fromValue !== undefined) return fromValue
  const tokens = tokenizeQuery(query)
  const kept = tokens.filter(token => !isSearchOperator(token))
  return kept.length === tokens.length ? query : kept.join(' ')
}
