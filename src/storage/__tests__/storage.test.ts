import {jest, beforeAll, afterEach, expect, test} from '@jest/globals'
// has a built-in mock
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as storage from '#/storage'

beforeAll(async () => {
  await storage.init()
  jest.mocked(AsyncStorage.getItem).mockClear()
})

afterEach(() => {
  jest.mocked(AsyncStorage.getItem).mockClear()
})

test(`gets and sets data synchronously`, async () => {
  storage.set('shell', {colorMode: 'light'})
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    storage.ROOT_STATE_STORAGE_KEY,
    JSON.stringify({shell: {colorMode: 'light'}}),
  )
  storage.set('shell', {colorMode: 'light'})
  expect(AsyncStorage.getItem).not.toHaveBeenCalled()

  storage.set('shell', {colorMode: 'dark'})
  // @ts-expect-error
  expect(storage.get('shell').colorMode).toBe('dark')
})

test(`set ignores error and continues in memory`, async () => {
  storage.set('shell', {colorMode: 'light'})

  jest
    .mocked(AsyncStorage.setItem)
    .mockImplementationOnce(() => Promise.reject(new Error('test error')))

  await storage.set('shell', {colorMode: 'system'})

  // @ts-expect-error
  expect(storage.get('shell').colorMode).toBe('system')
})
