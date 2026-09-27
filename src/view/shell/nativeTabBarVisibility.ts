export function getNativeTabBarVisibility({
  isIPad,
  gtMobile,
  hasSession,
  signupQueued,
  showLoggedOut,
  onboardingActive,
  isVideoFeed,
}: {
  isIPad: boolean
  gtMobile: boolean
  hasSession: boolean
  signupQueued: boolean
  showLoggedOut: boolean
  onboardingActive: boolean
  isVideoFeed: boolean
}) {
  const isWideIPad = isIPad && gtMobile
  const isAuthSurface =
    !hasSession || signupQueued || showLoggedOut || onboardingActive

  return {
    showTabletSidebar: isWideIPad && !isAuthSurface && !isVideoFeed,
    hideTabBar: isWideIPad && isAuthSurface,
  }
}
