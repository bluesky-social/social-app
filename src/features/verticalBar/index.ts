import {I18nManager} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useVerticalBarEdgeIOS} from 'expo-status-bar'

import {useBreakpoints} from '#/alf'
import {useAnalytics} from '#/analytics'
import {IS_IOS, IS_IPAD, IS_LIQUID_GLASS} from '#/env'
import {
  VERTICAL_BAR_RAIL_MARGIN,
  VERTICAL_BAR_SAFE_AREA_GAP,
} from '#/features/verticalBar/constants'

export {
  NATIVE_TAB_BAR_SIDE_MARGIN,
  VERTICAL_BAR_RAIL_MARGIN,
} from '#/features/verticalBar/constants'
export {
  getNativeTabsEnabled,
  setNativeTabsEnabled,
} from '#/features/verticalBar/nativeTabsEnabled'

/**
 * Whether the native iOS shell is enabled: native tabs on Liquid Glass
 * iPhones, plus adopting the iOS "vertical bar", the system rail beside the
 * content on iPhone Duo that holds the status bar (and UIKit's own bars).
 *
 * Off, the shell keeps the JS tab bar, keeps the status bar horizontal on
 * phone-width layouts and ignores the side insets, as before. On, the app:
 *
 * - uses native tabs where {@link useNativeTabBarPlacement} says so
 * - lets the system place the status bar in the vertical bar
 * - keeps content clear of the bar's side inset (see
 *   {@link useHorizontalSafeAreaInsets})
 */
export function useIsNativeTabsEnabled() {
  const ax = useAnalytics()
  return IS_IOS && ax.features.enabled(ax.features.NativeTabsEnable)
}

/**
 * Where the native tab bar goes, or `null` for the JS tab bar.
 *
 * - `side`: in the vertical bar (iPhone Duo), clear of the content
 * - `bottom`: floating over the bottom of the content (Liquid Glass iPhones)
 *
 * iPads keep the JS tab bar and its tablet sidebar. This deliberately doesn't
 * depend on the window size, since swapping navigators would lose the
 * navigation state, e.g. when an iPhone rotates or the Duo unfolds.
 */
export function useNativeTabBarPlacement(): 'side' | 'bottom' | null {
  const enabled = useIsNativeTabsEnabled()
  const edge = useVerticalBarEdgeIOS()
  if (!enabled) return null
  if (edge !== null) return 'side'
  if (IS_LIQUID_GLASS && !IS_IPAD) return 'bottom'
  return null
}

/**
 * Whether the shell uses native tabs. When this is true there is no JS bottom
 * bar, so its height is 0. Content clears the native tab bar using the bottom
 * safe area inset instead, which includes it (each tab has its own
 * `SafeAreaProvider`, see `NativeTabsNavigator`).
 */
export function useHasNativeTabs() {
  return useNativeTabBarPlacement() !== null
}

const NO_INSETS = {left: 0, right: 0}

/**
 * The left and right safe area insets, for content that should stay clear of
 * the vertical bar while its background runs underneath, like UIKit does.
 * Always 0 while the vertical bar is disabled, since the app has never read
 * side insets otherwise.
 */
export function useHorizontalSafeAreaInsets() {
  const enabled = useIsNativeTabsEnabled()
  const {left, right} = useSafeAreaInsets()
  return enabled ? {left, right} : NO_INSETS
}

/**
 * {@link useHorizontalSafeAreaInsets} for screen content that spans the full
 * width on phones but sits in a centered column on tablet layouts, where it
 * can't reach the vertical bar.
 */
export function usePhoneHorizontalSafeAreaInsets() {
  const insets = useHorizontalSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  return gtMobile ? NO_INSETS : insets
}

/**
 * Margins for things floating at the bottom of the content (the thread reply
 * prompt, the chat composer, the FAB) on phone-width iPhone Duo layouts, so
 * they sit level with the vertical bar's tab rail:
 * {@link VERTICAL_BAR_RAIL_MARGIN} from the screen's bottom and outer edges,
 * and from the rail itself. The side margins are from the safe area, which
 * already leaves {@link VERTICAL_BAR_SAFE_AREA_GAP} beside the rail. The
 * bottom is from the screen edge, since the rail ignores the home indicator's
 * inset too.
 *
 * `null` everywhere else, where the bar keeps its usual margins.
 */
export function useVerticalBarFloatingMargins(): {
  left: number
  right: number
  bottom: number
} | null {
  const placement = useNativeTabBarPlacement()
  const edge = useVerticalBarEdgeIOS()
  const {gtMobile} = useBreakpoints()
  if (placement !== 'side' || gtMobile || edge === null) return null
  const railOnLeft = (edge === 'leading') !== I18nManager.isRTL
  const railSide = VERTICAL_BAR_RAIL_MARGIN - VERTICAL_BAR_SAFE_AREA_GAP
  return {
    left: railOnLeft ? railSide : VERTICAL_BAR_RAIL_MARGIN,
    right: railOnLeft ? VERTICAL_BAR_RAIL_MARGIN : railSide,
    bottom: VERTICAL_BAR_RAIL_MARGIN,
  }
}
