import {test, expect} from '@jest/globals'

import * as utils from '../utils'

test(`web`, async () => {
  const result = utils.web('foo')
  expect(result).toBe(undefined)
})

test(`ios`, async () => {
  const result = utils.ios('foo')
  // TODO will fail in CI
  expect(result).toBe('foo')
})

test(`android`, async () => {
  const result = utils.android('foo')
  expect(result).toBe(undefined)
})

test(`native`, async () => {
  const result = utils.native('foo')
  expect(result).toBe('foo')
})
