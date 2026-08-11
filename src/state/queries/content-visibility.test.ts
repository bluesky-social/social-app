import {
  CONTENT_VISIBILITY_COLLECTION,
  createContentVisibilityRecord,
  parseContentVisibilityRecord,
} from './content-visibility-record'

describe('content visibility records', () => {
  it('creates a record with explicit hide semantics', () => {
    expect(createContentVisibilityRecord(true)).toEqual({
      $type: CONTENT_VISIBILITY_COLLECTION,
      hideFromAlgorithmicRecommendations: true,
    })
    expect(createContentVisibilityRecord(false)).toEqual({
      $type: CONTENT_VISIBILITY_COLLECTION,
      hideFromAlgorithmicRecommendations: false,
    })
  })

  it('parses valid records', () => {
    const record = createContentVisibilityRecord(true)
    expect(parseContentVisibilityRecord(record)).toBe(record)
  })

  it.each([
    null,
    {},
    {$type: CONTENT_VISIBILITY_COLLECTION},
    {
      $type: CONTENT_VISIBILITY_COLLECTION,
      hideFromAlgorithmicRecommendations: 'true',
    },
    {
      $type: 'app.bsky.actor.profile',
      hideFromAlgorithmicRecommendations: true,
    },
  ])('rejects invalid records: %p', value => {
    expect(() => parseContentVisibilityRecord(value)).toThrow(
      'Invalid content visibility record',
    )
  })
})
