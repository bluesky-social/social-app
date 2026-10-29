import {describe, expect, it} from '@jest/globals'

import {
  completeTrailingFrom,
  getProfileTypeaheadQuery,
  getTrailingFromValue,
} from '#/screens/Search/profileTypeahead'

describe(`getProfileTypeaheadQuery`, () => {
  it(`looks up the value of a from: being typed`, () => {
    expect(getProfileTypeaheadQuery(`from:nor`)).toBe(`nor`)
    expect(getProfileTypeaheadQuery(`from:`)).toBe(``)
    expect(getProfileTypeaheadQuery(`from:me cats from:norvid-s`)).toBe(
      `norvid-s`,
    )
  })

  it.each([
    `from:norvid-studies.bsky.social `,
    `cats from:alice.bsky.social `,
    `from:me `,
  ])(`looks up nothing right after a from: is completed: %j`, input => {
    expect(getProfileTypeaheadQuery(input)).toBe(``)
  })

  it.each([
    `unbe`,
    `paul frazee`,
    `from:me`,
    `from:me unbe`,
    `from:alice.bsky.social cats`,
    `"from:ali"`,
  ])(`passes %j through unchanged`, input => {
    expect(getProfileTypeaheadQuery(input)).toBe(input)
  })
})

describe(`getTrailingFromValue`, () => {
  it.each([
    [`from:`, ``],
    [`from:ali`, `ali`],
    [`from:@ali`, `ali`],
    [`cats from:ali`, `ali`],
    [`cats\tfrom:alice.bsky.social`, `alice.bsky.social`],
    [`from:norvid-s`, `norvid-s`],
    [`from:norvid_s`, `norvid_s`],
    [`from:josé`, `josé`],
    [`from:Me`, `Me`],
  ])(`%j -> %j`, (input, output) => {
    expect(getTrailingFromValue(input)).toBe(output)
  })

  it.each([
    `cats`,
    `from:me`,
    `from:ali `,
    `from:ali cats`,
    `-from:ali`,
    `xfrom:ali`,
    `From:ali`,
    `"from:ali"`,
    `cats "words from:ali`,
    `from:ali"`,
  ])(`%j -> undefined`, input => {
    expect(getTrailingFromValue(input)).toBeUndefined()
  })
})

describe(`completeTrailingFrom`, () => {
  it.each([
    [`from:nor`, `from:norvid-studies.bsky.social `],
    [`from:@nor`, `from:norvid-studies.bsky.social `],
    [`from:`, `from:norvid-studies.bsky.social `],
    [`cats  from:nor`, `cats  from:norvid-studies.bsky.social `],
  ])(`%j -> %j`, (input, output) => {
    expect(completeTrailingFrom(input, `norvid-studies.bsky.social`)).toBe(
      output,
    )
  })
})
