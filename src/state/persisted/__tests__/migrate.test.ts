import {jest, expect, test, afterEach} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'

import {defaults, schema} from '#/state/persisted/schema'
import {transform, migrate} from '#/state/persisted/legacy'
import * as store from '#/state/persisted/store'
import {logger} from '#/logger'
import * as fixtures from '#/state/persisted/__tests__/fixtures'

const write = jest.mocked(store.write)
const read = jest.mocked(store.read)

jest.mock('#/logger')
jest.mock('#/state/persisted/store', () => ({
  write: jest.fn(),
  read: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
  AsyncStorage.clear()
})

test('migrate: fresh install', async () => {
  await migrate()

  expect(AsyncStorage.getItem).toHaveBeenCalledWith('root')
  expect(read).toHaveBeenCalledTimes(1)
  expect(logger.info).toHaveBeenCalledWith(
    'persisted state: no migration needed',
  )
})

test('migrate: fresh install, existing new storage', async () => {
  read.mockResolvedValueOnce(defaults)

  await migrate()

  expect(AsyncStorage.getItem).toHaveBeenCalledWith('root')
  expect(read).toHaveBeenCalledTimes(1)
  expect(logger.info).toHaveBeenCalledWith(
    'persisted state: no migration needed',
  )
})

test('migrate: fresh install, AsyncStorage error', async () => {
  const prevGetItem = AsyncStorage.getItem

  const error = new Error('test error')

  AsyncStorage.getItem = jest.fn(() => {
    throw error
  })

  await migrate()

  expect(AsyncStorage.getItem).toHaveBeenCalledWith('root')
  expect(logger.error).toHaveBeenCalledWith(error, {
    message: 'persisted state: error migrating legacy storage',
  })

  AsyncStorage.getItem = prevGetItem
})

test('migrate: has legacy data', async () => {
  await AsyncStorage.setItem('root', JSON.stringify(fixtures.LEGACY_DATA_DUMP))

  await migrate()

  expect(write).toHaveBeenCalledWith(transform(fixtures.LEGACY_DATA_DUMP))
  expect(logger.info).toHaveBeenCalledWith(
    'persisted state: migrated legacy storage',
  )
})

test('migrate: has legacy data, fails validation', async () => {
  const legacy = fixtures.LEGACY_DATA_DUMP
  // @ts-ignore
  legacy.shell.colorMode = 'invalid'
  await AsyncStorage.setItem('root', JSON.stringify(legacy))

  await migrate()

  const transformed = transform(legacy)
  const validate = schema.safeParse(transformed)

  expect(write).not.toHaveBeenCalled()
  expect(logger.error).toHaveBeenCalledWith(
    'persisted state: legacy data failed validation',
    // @ts-ignore
    {error: validate.error},
  )
})
