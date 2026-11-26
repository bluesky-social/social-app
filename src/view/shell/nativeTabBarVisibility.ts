export function getNativeTabBarVisibility({
  gtMobile,
  hasSession,
  signupQueued,
  showLoggedOut,
  onboardingActive,
  isVideoFeed,
  isFullScreen = false,
}: {
  gtMobile: boolean
  hasSession: boolean
  signupQueued: boolean
  showLoggedOut: boolean
  onboardingActive: boolean
  isVideoFeed: boolean
  /**
   * A screen that covers the whole window, like sharing a post as an image.
   * iOS presents these over the tab bar, but Android keeps them in the tab's
   * stack, under the bar, so the bar is hidden instead.
   */
  isFullScreen?: boolean
}) {
  const isAuthSurface =
    !hasSession || signupQueued || showLoggedOut || onboardingActive

  return {
    showTabletSidebar:
      gtMobile && !isAuthSurface && !isVideoFeed && !isFullScreen,
    hideTabBar: (gtMobile && isAuthSurface) || isFullScreen,
  }
}
