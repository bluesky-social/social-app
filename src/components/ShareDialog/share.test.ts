import {Linking} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {
  hasPasteFallback,
  needsPaste,
  openSharePlatform,
  OpenSharePlatformError,
} from './share'

let mockOS: 'ios' | 'android' | 'web' = 'ios'

jest.mock('#/env', () => ({
  get IS_IOS() {
    return mockOS === 'ios'
  },
  get IS_ANDROID() {
    return mockOS === 'android'
  },
}))

jest.mock('expo-clipboard', () => ({setUrlAsync: jest.fn()}))

jest.mock('@bsky.app/expo-bluesky-swiss-army', () => ({
  Share: {getInstalledPackages: jest.fn(), shareTextToPackage: jest.fn()},
}))

const content = {
  url: 'https://bsky.app/profile/alice.test/post/3abc',
  title: 'Post by @alice.test on Bluesky',
}

describe('openSharePlatform', () => {
  let openURL: jest.SpiedFunction<typeof Linking.openURL>

  beforeEach(() => {
    jest.clearAllMocks()
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
  })

  it('opens the share link on iOS', async () => {
    mockOS = 'ios'
    await expect(openSharePlatform('whatsapp', content)).resolves.toEqual({
      copiedLink: false,
    })
    expect(openURL).toHaveBeenCalledWith(
      `whatsapp://send?text=${encodeURIComponent(content.url)}`,
    )
  })

  it('copies the link and opens the app for copy-and-open apps', async () => {
    mockOS = 'ios'
    await expect(openSharePlatform('signal', content)).resolves.toEqual({
      copiedLink: true,
    })
    expect(Clipboard.setUrlAsync).toHaveBeenCalledWith(content.url)
    expect(openURL).toHaveBeenCalledWith('sgnl://')
  })

  it('copies the link and opens the app when asked to paste', async () => {
    mockOS = 'ios'
    await expect(
      openSharePlatform('messenger', content, {paste: true}),
    ).resolves.toEqual({copiedLink: true})
    expect(Clipboard.setUrlAsync).toHaveBeenCalledWith(content.url)
    expect(openURL).toHaveBeenCalledWith('fb-messenger://')
  })

  it('leaves the clipboard alone when a copy-and-open app is gone', async () => {
    mockOS = 'ios'
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false)
    await expect(openSharePlatform('signal', content)).rejects.toThrow(
      'not installed',
    )
    expect(Clipboard.setUrlAsync).not.toHaveBeenCalled()
    expect(openURL).not.toHaveBeenCalled()
  })

  it('sends to the installed package for direct share on Android', async () => {
    mockOS = 'android'
    jest
      .mocked(Share.getInstalledPackages)
      .mockResolvedValue(['com.whatsapp.w4b'])
    await openSharePlatform('whatsapp', content)
    expect(Share.shareTextToPackage).toHaveBeenCalledWith(
      content.url,
      'com.whatsapp.w4b',
    )
    expect(openURL).not.toHaveBeenCalled()
  })

  it('rejects direct share when the app is gone', async () => {
    mockOS = 'android'
    jest.mocked(Share.getInstalledPackages).mockResolvedValue([])
    await expect(openSharePlatform('signal', content)).rejects.toThrow(
      'not installed',
    )
  })

  it('rejects platforms not supported on this OS', async () => {
    mockOS = 'web'
    await expect(openSharePlatform('whatsapp', content)).rejects.toThrow(
      'not supported',
    )
  })
})

describe('openSharePlatform errors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
  })

  async function getError(promise: Promise<unknown>) {
    const error = await promise.catch((e: unknown) => e)
    expect(error).toBeInstanceOf(OpenSharePlatformError)
    return error as OpenSharePlatformError
  }

  it('says the app is gone when its scheme no longer opens', async () => {
    mockOS = 'ios'
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false)
    const error = await getError(openSharePlatform('signal', content))
    expect(error.step).toBe('notInstalled')
  })

  it('says copying failed when the clipboard throws', async () => {
    mockOS = 'ios'
    jest.mocked(Clipboard.setUrlAsync).mockRejectedValueOnce(new Error('nope'))
    const error = await getError(openSharePlatform('signal', content))
    expect(error.step).toBe('clipboard')
    expect(error.message).toBe('nope')
  })

  it('says the OS refused, without the link it tried', async () => {
    mockOS = 'ios'
    const shareUrl = `whatsapp://send?text=${encodeURIComponent(content.url)}`
    jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error(`Unable to open URL: ${shareUrl}`))
    const error = await getError(openSharePlatform('whatsapp', content))
    expect(error.step).toBe('openUrl')
    expect(error.message).toBe('Unable to open URL: whatsapp:<link>')
  })

  it('says sending failed when direct share throws on Android', async () => {
    mockOS = 'android'
    jest
      .mocked(Share.getInstalledPackages)
      .mockResolvedValueOnce(['org.thoughtcrime.securesms'])
    jest
      .mocked(Share.shareTextToPackage)
      .mockRejectedValueOnce(new Error('no activity'))
    const error = await getError(openSharePlatform('signal', content))
    expect(error.step).toBe('shareToPackage')
  })

  it('says the platform is unsupported on this OS', async () => {
    mockOS = 'web'
    const error = await getError(openSharePlatform('whatsapp', content))
    expect(error.step).toBe('unsupported')
  })
})

describe('needsPaste', () => {
  it('is true for copy-and-open apps on iOS only', () => {
    mockOS = 'ios'
    expect(needsPaste('signal')).toBe(true)
    expect(needsPaste('whatsapp')).toBe(false)
    mockOS = 'android'
    expect(needsPaste('signal')).toBe(false)
  })
})

describe('hasPasteFallback', () => {
  it('is true for apps with a paste fallback on iOS only', () => {
    mockOS = 'ios'
    expect(hasPasteFallback('messenger')).toBe(true)
    expect(hasPasteFallback('whatsapp')).toBe(false)
    mockOS = 'android'
    expect(hasPasteFallback('messenger')).toBe(false)
  })
})
