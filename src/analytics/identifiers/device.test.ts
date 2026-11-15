import AsyncStorage from '@react-native-async-storage/async-storage'

import {device} from '#/storage'
import {getAndMigrateDeviceId, getDeviceId} from './device'

jest.mock('#/storage', () => ({
  device: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('device identifier', () => {
  it('reads the migrated ID from memory after initialization', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('legacy-device-id')

    await expect(getAndMigrateDeviceId()).resolves.toBe('legacy-device-id')
    jest.mocked(device.get).mockClear()

    expect(getDeviceId()).toBe('legacy-device-id')
    expect(getDeviceId()).toBe('legacy-device-id')
    expect(device.get).not.toHaveBeenCalled()
  })
})
