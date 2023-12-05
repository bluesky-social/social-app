import {expect, test} from '@jest/globals'

import {transform} from '#/state/persisted/legacy'
import {defaults, schema} from '#/state/persisted/schema'

test('defaults', () => {
  expect(() => schema.parse(defaults)).not.toThrow()
})

test('transform', () => {
  const data = transform({})
  expect(() => schema.parse(data)).not.toThrow()
})
