import {expect, test} from '@jest/globals'

import {transform} from '#/state/persisted/legacy'
import {schema} from '#/state/persisted/schema'

test('transform', () => {
  const data = transform({})
  expect(() => schema.parse(data)).not.toThrow()
})
