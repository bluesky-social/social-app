export const PROFILE_BANNER_HEIGHT = 150

/** Cover the iPad profile banner within the top safe area, but leave phones alone. */
export function getProfileBannerSafeAreaCoverHeight({
  isIPad,
  topInset,
}: {
  isIPad: boolean
  topInset: number
}) {
  return isIPad ? topInset : 0
}

/** Phones use a light status bar over the profile banner; iPad does not. */
export function shouldUseProfileLightStatusBar({
  isIPad,
  isScreenFocused,
  isHeaderHidden,
}: {
  isIPad: boolean
  isScreenFocused: boolean
  isHeaderHidden: boolean
}) {
  return !isIPad && isScreenFocused && isHeaderHidden
}
