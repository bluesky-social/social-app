import {app} from '#/lexicons'

export const CONTENT_VISIBILITY_COLLECTION =
  'app.bsky.actor.contentVisibilityDeclaration' as const
export const CONTENT_VISIBILITY_RKEY = 'self'

export type ContentVisibilityRecord =
  app.bsky.actor.contentVisibilityDeclaration.Main

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
  const result =
    app.bsky.actor.contentVisibilityDeclaration.main.safeParse(value)
  if (!result.success) {
    throw new Error('Invalid content visibility record', {
      cause: result.reason,
    })
  }
  return result.value
}
