/**
 * UIKit's side margin for the floating native tab bar on iPhones, so floating
 * controls above it (the thread reply prompt, the FAB, scroll to top) can line
 * up with its edges. It's the same on 402pt and 440pt wide screens (measured
 * on iOS 27.2).
 */
export const NATIVE_TAB_BAR_SIDE_MARGIN = 21

/**
 * The gap UIKit leaves between the vertical bar's tab rail and the screen's
 * side and bottom edges on iPhone Duo (measured on iOS 27.2), so bars
 * floating at the bottom of the content can sit level with it.
 */
export const VERTICAL_BAR_RAIL_MARGIN = 24

/**
 * The gap between the vertical bar's tab rail and the edge of the safe area
 * beside it on iPhone Duo (measured on iOS 27.2).
 */
export const VERTICAL_BAR_SAFE_AREA_GAP = 12
