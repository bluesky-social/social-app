import {describe, expect, test} from '@jest/globals'

import {parseTagsInput} from '#/components/ComposerV2/tester/parseTagsInput'

describe('parseTagsInput', () => {
  test('splits at commas, trims, strips a leading #, drops empties', () => {
    expect(parseTagsInput('one, #two ,three,, ,')).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  test('dedupes while preserving first-seen order', () => {
    expect(parseTagsInput('b, a, b, #a')).toEqual(['b', 'a'])
  })

  test('empty input produces no tags', () => {
    expect(parseTagsInput('')).toEqual([])
    expect(parseTagsInput(' , ,')).toEqual([])
  })
})
