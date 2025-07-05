import {AtUri} from '@atproto/api'

import {type ApplyPostCacheMutator} from '#/state/queries/cache/types'

/**
 * Symbol used to indicate that a value has been deleted.
 */
export const DELETED_POST = Symbol('DELETED_POST')

/**
 * Sugar for creating a post cache mutator, for use alongside the definitions
 * for all post queries.
 */
export function createApplyPostCacheMutator(
  applyPostCacheMutator: ApplyPostCacheMutator,
) {
  return applyPostCacheMutator
}

/**
 * Checks if a source URI matches a given URI, or the same URI with handle in
 * place of a DID.
 */
export function uriMatches(
  sourceUri: string,
  matchUri: string,
  matchHandle?: string,
) {
  const source = new AtUri(sourceUri)
  if (source.host.startsWith('did:')) return source.toString() === matchUri
  if (!matchHandle) return false
  source.host = matchHandle
  return source.toString() === matchUri
}
