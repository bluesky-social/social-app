/*
 * Native tabs and the vertical bar are iOS-only, so web skips the feature flag (and the
 * analytics import that comes with it) entirely.
 */
export {NATIVE_TAB_BAR_SIDE_MARGIN} from '#/features/verticalBar/constants'
export {
  getNativeTabsMounted,
  setNativeTabsMounted,
} from '#/features/verticalBar/nativeTabsMounted'

const NO_INSETS = {left: 0, right: 0}

export function useIsNativeTabsEnabled() {
  return false
}

export function useNativeTabBarPlacement(): 'side' | 'bottom' | null {
  return null
}

export function useHasNativeTabs() {
  return false
}

export function useHorizontalSafeAreaInsets() {
  return NO_INSETS
}

export function usePhoneHorizontalSafeAreaInsets() {
  return NO_INSETS
}
