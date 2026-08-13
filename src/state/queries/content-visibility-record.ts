import {AppBskyActorContentVisibilityDeclaration} from '@atproto/api'

export const CONTENT_VISIBILITY_COLLECTION =
  'app.bsky.actor.contentVisibilityDeclaration' as const
export const CONTENT_VISIBILITY_RKEY = 'self'

export type ContentVisibilityRecord =
  AppBskyActorContentVisibilityDeclaration.Record

export function createContentVisibilityRecord(
  hideFromAlgorithmicRecommendations: boolean,
): ContentVisibilityRecord {
  return {
    $type: CONTENT_VISIBILITY_COLLECTION,
    hideFromAlgorithmicRecommendations,
  }
}

export function parseContentVisibilityRecord(
  value: unknown,
): ContentVisibilityRecord {
  const result = AppBskyActorContentVisibilityDeclaration.validateRecord(value)
  if (!result.success) {
    throw new Error('Invalid content visibility record', {
      cause: result.error,
    })
  }
  return result.value
}
