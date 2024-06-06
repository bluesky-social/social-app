import {afterEach, expect, jest, test} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as persisted from '#/state/persisted'
import {migrate} from '#/state/persisted/legacy'
import {defaults} from '#/state/persisted/schema'
import * as store from '#/state/persisted/store'

const write = jest.mocked(store.write)
const read = jest.mocked(store.read)

jest.mock('#/logger')
jest.mock('#/state/persisted/legacy', () => ({
  migrate: jest.fn(),
}))
jest.mock('#/state/persisted/store', () => ({
  write: jest.fn(),
  read: jest.fn(),
}))

afterEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  AsyncStorage.clear()
})

test('init: fresh install, no migration', async () => {
  await persisted.init()

  expect(migrate).toHaveBeenCalledTimes(1)
  expect(read).toHaveBeenCalledTimes(1)
  expect(write).toHaveBeenCalledWith(defaults)

  // default value
  expect(persisted.get('colorMode')).toBe('system')
})

test('init: fresh install, migration ran', async () => {
  read.mockResolvedValueOnce(defaults)

  await persisted.init()

  expect(migrate).toHaveBeenCalledTimes(1)
  expect(read).toHaveBeenCalledTimes(1)
  expect(write).not.toHaveBeenCalled()

  // default value
  expect(persisted.get('colorMode')).toBe('system')
})
