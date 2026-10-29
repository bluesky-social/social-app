import {tokenizeQuery} from '#/state/queries/search-posts-params'

/**
 * A `from:` operator and the part of its value typed so far. Letters, digits,
 * `.`, `_` and `-` cover handles and most display names; anything else (a
 * quote, a paren) means the value isn't an account being typed.
 */
const FROM_OPERATOR_RE = /^from:@?([\p{L}\p{N}._-]*)$/u

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
 * The text to look up in the profile typeahead for a search query. While a
 * `from:` operator is being typed at the end, that's its value so far: the
 * typeahead backend ignores search operators, so `from:nor` as-is would match
 * nothing. Otherwise it's the query as typed.
 */
export function getProfileTypeaheadQuery(query: string): string {
  const fromValue = getTrailingFromValue(query)
  if (fromValue !== undefined) return fromValue
  /*
   * Right after a from: handle is completed there's nothing to look up yet.
   * Sending the query anyway would leave the handle's suggestions on screen
   * until the empty response arrived, and tapping one would open the profile.
   */
  const lastToken = tokenizeQuery(query).at(-1) ?? ''
  if (/\s$/u.test(query) && FROM_OPERATOR_RE.test(lastToken)) return ''
  return query
}
