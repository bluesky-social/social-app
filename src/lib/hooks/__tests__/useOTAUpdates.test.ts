import {beforeEach, describe, expect, jest, test} from '@jest/globals'

import {
  consumeOTAReloadMarker,
  reloadWithUpdate,
} from '#/lib/hooks/useOTAUpdates'
import {device} from '#/storage'

jest.mock('react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map()

    set(key: string, value: unknown) {
      this._store.set(key, value)
    }

    getString(key: string) {
      return this._store.get(key)
    }

    delete(key: string) {
      return this._store.delete(key)
    }
  },
}))

jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  isEnabled: true,
  reloadAsync: jest.fn(),
  setExtraParamAsync: jest.fn(),
  useUpdates: jest.fn(),
}))

describe('consumeOTAReloadMarker', () => {
  beforeEach(() => {
    device.remove(['otaReloadedAt'])
  })

  test('is false when the app was not reloaded by us', () => {
    expect(consumeOTAReloadMarker()).toBe(false)
  })

  test('is true in the runtime that follows a reload', async () => {
    await reloadWithUpdate()
    expect(consumeOTAReloadMarker()).toBe(true)
  })

  test('only the first caller in a runtime sees the marker', async () => {
    await reloadWithUpdate()
    expect(consumeOTAReloadMarker()).toBe(true)
    expect(consumeOTAReloadMarker()).toBe(false)
  })

  test('ignores a marker left behind by a reload that never happened', () => {
    device.set(['otaReloadedAt'], Date.now() - 5 * 60e3)
    expect(consumeOTAReloadMarker()).toBe(false)
  })
})
