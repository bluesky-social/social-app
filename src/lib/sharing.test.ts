import {Share} from 'react-native'
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'

jest.mock('#/components/Toast', () => ({show: jest.fn()}))

beforeEach(() => {
  jest.resetModules()
})

afterEach(() => {
  jest.restoreAllMocks()
})

function loadShareUrl({
  platform,
  nativeModule,
}: {
  platform: 'ios' | 'android'
  nativeModule?: {isAvailable: boolean; shareText: jest.Mock}
}) {
  jest.doMock('#/env', () => ({
    IS_IOS: platform === 'ios',
    IS_ANDROID: platform === 'android',
  }))
  jest.doMock('@bsky.app/expo-bluesky-swiss-army', () => ({
    Share: nativeModule ?? {isAvailable: false, shareText: jest.fn()},
  }))
  const sharing: typeof import('./sharing') = require('./sharing')
  return sharing.shareUrl
}

describe('shareUrl', () => {
  it('reports the chosen app on iOS', async () => {
    jest.spyOn(Share, 'share').mockResolvedValueOnce({
      action: Share.sharedAction,
      activityType: 'net.whatsapp.WhatsApp.ShareExtension',
    })
    const shareUrl = loadShareUrl({platform: 'ios'})

    await expect(shareUrl('https://bsky.app/x')).resolves.toEqual({
      status: 'shared',
      target: 'net.whatsapp.WhatsApp.ShareExtension',
    })
  })

  it('reports a dismissed share sheet on iOS', async () => {
    jest.spyOn(Share, 'share').mockResolvedValueOnce({
      action: Share.dismissedAction,
      activityType: undefined,
    })
    const shareUrl = loadShareUrl({platform: 'ios'})

    await expect(shareUrl('https://bsky.app/x')).resolves.toEqual({
      status: 'dismissed',
    })
  })

  it('uses the native module on Android when available', async () => {
    const shareText = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({action: 'sharedAction', target: 'com.whatsapp'})
    const rnShare = jest.spyOn(Share, 'share')
    const shareUrl = loadShareUrl({
      platform: 'android',
      nativeModule: {isAvailable: true, shareText},
    })

    await expect(shareUrl('https://bsky.app/x')).resolves.toEqual({
      status: 'shared',
      target: 'com.whatsapp',
    })
    expect(shareText).toHaveBeenCalledWith('https://bsky.app/x')
    expect(rnShare).not.toHaveBeenCalled()
  })

  it('falls back to React Native Share on Android without the native module', async () => {
    const rnShare = jest.spyOn(Share, 'share').mockResolvedValueOnce({
      action: Share.sharedAction,
      activityType: undefined,
    })
    const shareUrl = loadShareUrl({platform: 'android'})

    await expect(shareUrl('https://bsky.app/x')).resolves.toBeUndefined()
    expect(rnShare).toHaveBeenCalledWith({message: 'https://bsky.app/x'})
  })
})
