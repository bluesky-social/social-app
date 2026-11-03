import {Linking} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {Share} from '@bsky.app/expo-bluesky-swiss-army'
import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {openSharePlatform} from './share'

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

  it('sends to the installed package for direct share on Android', async () => {
    mockOS = 'android'
    jest
      .mocked(Share.getInstalledPackages)
      .mockReturnValue(['com.whatsapp.w4b'])
    await openSharePlatform('whatsapp', content)
    expect(Share.shareTextToPackage).toHaveBeenCalledWith(
      content.url,
      'com.whatsapp.w4b',
    )
    expect(openURL).not.toHaveBeenCalled()
  })

  it('rejects direct share when the app is gone', async () => {
    mockOS = 'android'
    jest.mocked(Share.getInstalledPackages).mockReturnValue([])
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
