import {getNativeTabBarVisibility} from './nativeTabBarVisibility'

const base = {
  isIPad: true,
  gtMobile: true,
  hasSession: true,
  signupQueued: false,
  showLoggedOut: false,
  onboardingActive: false,
  isVideoFeed: false,
}

describe('getNativeTabBarVisibility', () => {
  it('shows the tablet sidebar for regular signed-in routes', () => {
    expect(getNativeTabBarVisibility(base)).toEqual({
      showTabletSidebar: true,
      hideTabBar: false,
    })
  })

  it.each([
    ['account switching', {showLoggedOut: true}],
    ['queued signup', {signupQueued: true}],
    ['onboarding', {onboardingActive: true}],
    ['signed out', {hasSession: false}],
  ])('hides tablet navigation during %s', (_surface, overrides) => {
    expect(getNativeTabBarVisibility({...base, ...overrides})).toEqual({
      showTabletSidebar: false,
      hideTabBar: true,
    })
  })

  it('keeps the existing bottom-bar behavior for the video feed', () => {
    expect(getNativeTabBarVisibility({...base, isVideoFeed: true})).toEqual({
      showTabletSidebar: false,
      hideTabBar: false,
    })
  })

  it('preserves phone-like navigation on compact iPads and non-iPads', () => {
    expect(getNativeTabBarVisibility({...base, gtMobile: false})).toEqual({
      showTabletSidebar: false,
      hideTabBar: false,
    })
    expect(getNativeTabBarVisibility({...base, isIPad: false})).toEqual({
      showTabletSidebar: false,
      hideTabBar: false,
    })
  })
})
