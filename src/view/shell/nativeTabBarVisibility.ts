export function getNativeTabBarVisibility({
  gtMobile,
  hasSession,
  signupQueued,
  showLoggedOut,
  onboardingActive,
  isVideoFeed,
}: {
  gtMobile: boolean
  hasSession: boolean
  signupQueued: boolean
  showLoggedOut: boolean
  onboardingActive: boolean
  isVideoFeed: boolean
}) {
  const isAuthSurface =
    !hasSession || signupQueued || showLoggedOut || onboardingActive

  return {
    showTabletSidebar: gtMobile && !isAuthSurface && !isVideoFeed,
    hideTabBar: gtMobile && isAuthSurface,
  }
}
