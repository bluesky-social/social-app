import {describe, expect, it, jest} from '@jest/globals'

import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'

jest.mock('#/env', () => ({IS_WEB: false}))

import {aggregateUserInterests, createBskyTopicsHeader} from '../utils'

function preferences(
  interests: Pick<
    UsePreferencesQueryResponse['interests'],
    'tags' | 'updatedAt'
  >,
) {
  return {interests} as UsePreferencesQueryResponse
}

describe('aggregateUserInterests', () => {
  it('appends the update timestamp after a semicolon', () => {
    expect(
      createBskyTopicsHeader(
        aggregateUserInterests(
          preferences({
            tags: ['animals', 'music'],
            updatedAt: '2026-09-03T17:00:00.000Z',
          }),
        ),
      ),
    ).toEqual({
      'x-atproto-bsky-topics': 'animals,music;2026-09-03T17:00:00.000Z',
    })
  })

  it('supports interests created before update timestamps were recorded', () => {
    expect(aggregateUserInterests(preferences({tags: ['animals']}))).toBe(
      'animals',
    )
  })

  it('passes the timestamp when the user has no selected interests', () => {
    expect(
      aggregateUserInterests(
        preferences({
          tags: [],
          updatedAt: '2026-09-03T17:00:00.000Z',
        }),
      ),
    ).toBe(';2026-09-03T17:00:00.000Z')
  })
})
