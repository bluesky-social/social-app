import {
  getProfileBannerSafeAreaCoverHeight,
  shouldUseProfileLightStatusBar,
} from './layout'

describe('getProfileBannerSafeAreaCoverHeight', () => {
  it('covers the image in the iPad safe area', () => {
    expect(
      getProfileBannerSafeAreaCoverHeight({
        isIPad: true,
        topInset: 24,
      }),
    ).toBe(24)
  })

  it('leaves phone banner behavior unchanged', () => {
    expect(
      getProfileBannerSafeAreaCoverHeight({
        isIPad: false,
        topInset: 24,
      }),
    ).toBe(0)
  })
})

describe('shouldUseProfileLightStatusBar', () => {
  it('preserves the phone header status bar behavior', () => {
    expect(
      shouldUseProfileLightStatusBar({
        isIPad: false,
        isScreenFocused: true,
        isHeaderHidden: true,
      }),
    ).toBe(true)
  })

  it('does not override the iPad status bar color', () => {
    expect(
      shouldUseProfileLightStatusBar({
        isIPad: true,
        isScreenFocused: true,
        isHeaderHidden: true,
      }),
    ).toBe(false)
  })
})
