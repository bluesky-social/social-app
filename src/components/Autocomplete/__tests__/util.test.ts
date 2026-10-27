import {describe, expect, it} from '@jest/globals'

import {isWholeWordMatch} from '#/components/Autocomplete/util'

/*
 * What app.bsky.actor.searchActorsTypeahead returned for `norvid-s`: the
 * account being typed, then accounts that only match the `s`.
 */
const NORVID_S_RESULTS = [
  {handle: 'norvid-studies.bsky.social', displayName: 'norvid_studies'},
  {handle: 'stephenking.bsky.social', displayName: 'Stephen King'},
  {handle: 'safety.bsky.app', displayName: 'Bluesky Safety'},
  {handle: 'cpsc.gov', displayName: 'U.S. Consumer Product Safety Commission'},
]

describe(`isWholeWordMatch`, () => {
  it(`drops accounts that only match part of a hyphenated word`, () => {
    expect(
      NORVID_S_RESULTS.filter(isWholeWordMatch(`norvid-s`)).map(p => p.handle),
    ).toEqual([`norvid-studies.bsky.social`])
  })

  it(`matches case-insensitively, ignoring a leading @`, () => {
    expect(
      NORVID_S_RESULTS.filter(isWholeWordMatch(`@Norvid-S`)).map(p => p.handle),
    ).toEqual([`norvid-studies.bsky.social`])
  })

  it(`matches hyphenated display names`, () => {
    const match = isWholeWordMatch(`jean-l`)
    expect(match({handle: `picard.bsky.social`, displayName: `Jean-Luc`})).toBe(
      true,
    )
    expect(match({handle: `picard.bsky.social`})).toBe(false)
  })

  it.each([`s`, `norvid`, `jay.bsky`, `paul fr`, `stephen k-`])(
    `keeps everything for %j`,
    query => {
      expect(NORVID_S_RESULTS.filter(isWholeWordMatch(query))).toEqual(
        NORVID_S_RESULTS,
      )
    },
  )
})
