export const PROFILE_BANNER_HEIGHT = 150

/** Cover the wide profile banner within the top safe area, but leave compact windows alone. */
export function getProfileBannerSafeAreaCoverHeight({
  gtMobile,
  topInset,
}: {
  gtMobile: boolean
  topInset: number
}) {
  return gtMobile ? topInset : 0
}

/** Compact windows use a light status bar over the profile banner. */
export function shouldUseProfileLightStatusBar({
  gtMobile,
  isScreenFocused,
  isHeaderHidden,
}: {
  gtMobile: boolean
  isScreenFocused: boolean
  isHeaderHidden: boolean
}) {
  return !gtMobile && isScreenFocused && isHeaderHidden
}
