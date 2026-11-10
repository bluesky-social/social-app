import {Linking} from 'react-native'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {getInstalledSharePlatforms} from './detect'

let mockOS: 'ios' | 'android' | 'web' = 'ios'

jest.mock('#/env', () => ({
  get IS_IOS() {
    return mockOS === 'ios'
  },
  get IS_ANDROID() {
    return mockOS === 'android'
  },
}))

jest.mock('@bsky.app/expo-bluesky-swiss-army', () => ({
  Share: {getInstalledPackages: jest.fn()},
}))

const getInstalledPackages = jest.mocked(Share.getInstalledPackages)

function mockHandledSchemes(schemes: string[]) {
  jest
    .spyOn(Linking, 'canOpenURL')
    .mockImplementation(url =>
      Promise.resolve(schemes.some(s => url.startsWith(`${s}:`))),
    )
}

describe('getInstalledSharePlatforms', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    getInstalledPackages.mockReset()
  })

  it('returns installed iOS apps in catalog order', async () => {
    mockOS = 'ios'
    mockHandledSchemes(['line', 'sms', 'whatsapp'])
    await expect(getInstalledSharePlatforms()).resolves.toEqual([
      'messages',
      'whatsapp',
      'line',
    ])
  })

  it('detects copy-and-open apps on iOS by their scheme', async () => {
    mockOS = 'ios'
    mockHandledSchemes(['sgnl', 'whatsapp'])
    await expect(getInstalledSharePlatforms()).resolves.toEqual([
      'whatsapp',
      'signal',
    ])
  })

  it('checks packages and system schemes on Android', async () => {
    mockOS = 'android'
    mockHandledSchemes(['mailto'])
    getInstalledPackages.mockResolvedValue([
      'com.whatsapp.w4b',
      'org.thoughtcrime.securesms',
    ])
    await expect(getInstalledSharePlatforms()).resolves.toEqual([
      'whatsapp',
      'signal',
      'email',
    ])
  })

  it('hides package-based apps when the binary cannot check', async () => {
    mockOS = 'android'
    mockHandledSchemes(['sms'])
    getInstalledPackages.mockResolvedValue(null)
    await expect(getInstalledSharePlatforms()).resolves.toEqual(['messages'])
  })

  it('treats a failed scheme check as not installed', async () => {
    mockOS = 'ios'
    jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('nope'))
    await expect(getInstalledSharePlatforms()).resolves.toEqual([])
  })

  it('returns nothing on web', async () => {
    mockOS = 'web'
    await expect(getInstalledSharePlatforms()).resolves.toEqual([])
  })
})
