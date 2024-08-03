import {expect, test} from '@jest/globals'

import {defaults, schema} from '#/state/persisted/schema'

test('defaults', () => {
  expect(() => schema.parse(defaults)).not.toThrow()
})
