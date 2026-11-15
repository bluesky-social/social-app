import {
  getProfileBannerSafeAreaCoverHeight,
  shouldUseProfileLightStatusBar,
} from './layout'

describe('getProfileBannerSafeAreaCoverHeight', () => {
  it('covers the image in a wide native safe area', () => {
    expect(
      getProfileBannerSafeAreaCoverHeight({
        gtMobile: true,
        topInset: 24,
      }),
    ).toBe(24)
  })

  it('leaves compact banner behavior unchanged', () => {
    expect(
      getProfileBannerSafeAreaCoverHeight({
        gtMobile: false,
        topInset: 24,
      }),
    ).toBe(0)
  })
})

describe('shouldUseProfileLightStatusBar', () => {
  it('preserves compact header status bar behavior', () => {
    expect(
      shouldUseProfileLightStatusBar({
        gtMobile: false,
        isScreenFocused: true,
        isHeaderHidden: true,
      }),
    ).toBe(true)
  })

  it('does not override the wide status bar color', () => {
    expect(
      shouldUseProfileLightStatusBar({
        gtMobile: true,
        isScreenFocused: true,
        isHeaderHidden: true,
      }),
    ).toBe(false)
  })
})
