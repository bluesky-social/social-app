import {describe, expect, it} from '@jest/globals'

import {getProfileTypeaheadQuery} from '#/screens/Search/profileTypeahead'

describe(`getProfileTypeaheadQuery`, () => {
  it.each([
    [`unbe`, `unbe`],
    [`paul frazee`, `paul frazee`],
    [`from:me unbe`, `unbe`],
    [`unbe from:me`, `unbe`],
    [`from:me`, ``],
    [`from:`, ``],
    [`from:norvid-s`, ``],
    [`cats from:alice.bsky.social`, `cats`],
    [`-from:alice cats`, `cats`],
    [`From:me cats`, `cats`],
    [
      `cats to:bob mentions:carol domain:bsky.app url:bsky.app/x lang:en since:2024-01-01 until:2024-02-01`,
      `cats`,
    ],
  ])(`%j -> %j`, (input, output) => {
    expect(getProfileTypeaheadQuery(input)).toBe(output)
  })

  it(`keeps text that only looks like an operator`, () => {
    expect(getProfileTypeaheadQuery(`re:invent`)).toBe(`re:invent`)
    expect(getProfileTypeaheadQuery(`"from:me" cats`)).toBe(`"from:me" cats`)
  })
})
