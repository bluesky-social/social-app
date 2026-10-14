import {describe, expect, test} from '@jest/globals'

import {parseTagsInput} from '#/view/screens/DebugComposer/parseTagsInput'

describe('parseTagsInput', () => {
  test('splits at commas, trims, strips a leading #, drops empties', () => {
    expect(parseTagsInput({text: 'one, #two ,three,, ,'})).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  test('dedupes while preserving first-seen order', () => {
    expect(parseTagsInput({text: 'b, a, b, #a'})).toEqual(['b', 'a'])
  })

  test('empty input produces no tags', () => {
    expect(parseTagsInput({text: ''})).toEqual([])
    expect(parseTagsInput({text: ' , ,'})).toEqual([])
  })
})
