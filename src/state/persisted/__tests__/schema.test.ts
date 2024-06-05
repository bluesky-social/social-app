import {expect, test} from '@jest/globals'

import * as fixtures from '#/state/persisted/__tests__/fixtures'
import {transform} from '#/state/persisted/legacy'
import {defaults, schema} from '#/state/persisted/schema'

test('defaults', () => {
  expect(() => schema.parse(defaults)).not.toThrow()
})

test('transform', () => {
  const data = transform({})
  expect(() => schema.parse(data)).not.toThrow()
})

test('transform: legacy fixture', () => {
  const data = transform(fixtures.LEGACY_DATA_DUMP)
  expect(() => schema.parse(data)).not.toThrow()
  expect(data.session.currentAccount?.did).toEqual(fixtures.ALICE_DID)
  expect(data.session.accounts.length).toEqual(2)
})
