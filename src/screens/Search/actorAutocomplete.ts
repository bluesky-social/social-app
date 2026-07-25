import {tokenizeQuery} from '#/state/queries/search-posts-params'

export type ActorSearchOperatorContext = {
  operator: 'from'
  query: string
  tokenStart: number
}

export type ActorAutocompleteState = {
  context: ActorSearchOperatorContext | null
  query: string
  showFullSearchFallback: boolean
}

/**
 * Returns the actor-valued search operator currently being typed. Operators
 * are only completed at the end of the input so editing ordinary query text
 * doesn't unexpectedly open an actor typeahead.
 */
function getActorSearchOperatorContext(
  value: string,
): ActorSearchOperatorContext | null {
  if (!value || /\s$/u.test(value)) return null

  const token = tokenizeQuery(value).at(-1)
  if (!token) return null

  const match = /^from:@?([^"\s]*)$/iu.exec(token)
  if (!match) return null
  /*
   * `me` is a reserved backend value meaning the current viewer, not an actor
   * prefix to resolve through typeahead.
   */
  if (match[1] === 'me') return null

  return {
    operator: 'from',
    query: match[1],
    tokenStart: value.length - token.length,
  }
}

function hasActorSearchOperator(value: string): boolean {
  return tokenizeQuery(value).some(token => /^from:@?[^"\s]+$/iu.test(token))
}

/**
 * Derives actor typeahead behavior from the full search input.
 *
 * An in-progress `from:` operator searches by only its handle fragment. A
 * completed operator suppresses profile autocomplete while preserving the
 * fallback that submits the full search. A bare `from:` is incomplete, so it
 * shows neither profiles nor a submit fallback.
 */
export function getActorAutocompleteState(
  value: string,
): ActorAutocompleteState {
  const context = getActorSearchOperatorContext(value)
  if (context) {
    return {
      context,
      query: context.query,
      showFullSearchFallback: context.query.length > 0,
    }
  }

  const hasCompletedOperator = hasActorSearchOperator(value)
  return {
    context: null,
    query: hasCompletedOperator ? '' : value,
    showFullSearchFallback: hasCompletedOperator,
  }
}

/**
 * Replaces the in-progress operator with the selected handle. The trailing
 * space closes the typeahead and leaves the input ready for another term.
 */
export function completeActorSearchOperator(
  value: string,
  context: ActorSearchOperatorContext,
  handle: string,
): string {
  return `${value.slice(0, context.tokenStart)}${context.operator}:${handle} `
}
