export const CONTENT_VISIBILITY_COLLECTION =
  'app.bsky.actor.contentVisibilityDeclaration' as const
export const CONTENT_VISIBILITY_RKEY = 'self'

export type ContentVisibilityRecord = {
  $type: typeof CONTENT_VISIBILITY_COLLECTION
  hideFromAlgorithmicRecommendations: boolean
}

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
  if (
    typeof value !== 'object' ||
    value === null ||
    !('$type' in value) ||
    value.$type !== CONTENT_VISIBILITY_COLLECTION ||
    !('hideFromAlgorithmicRecommendations' in value) ||
    typeof value.hideFromAlgorithmicRecommendations !== 'boolean'
  ) {
    throw new Error('Invalid content visibility record')
  }

  return value as ContentVisibilityRecord
}
