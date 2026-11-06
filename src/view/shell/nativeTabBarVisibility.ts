export function getNativeTabBarVisibility({
  gtMobile,
  hasSession,
  signupQueued,
  showLoggedOut,
  onboardingActive,
  isVideoFeed,
  foldedRightNavigation = false,
}: {
  gtMobile: boolean
  hasSession: boolean
  signupQueued: boolean
  showLoggedOut: boolean
  onboardingActive: boolean
  isVideoFeed: boolean
  foldedRightNavigation?: boolean
}) {
  const isAuthSurface =
    !hasSession || signupQueued || showLoggedOut || onboardingActive

  return {
    showTabletSidebar:
      gtMobile && !foldedRightNavigation && !isAuthSurface && !isVideoFeed,
    showFoldedRightRail:
      foldedRightNavigation && !isAuthSurface && !isVideoFeed,
    hideTabBar: gtMobile && isAuthSurface,
  }
}
