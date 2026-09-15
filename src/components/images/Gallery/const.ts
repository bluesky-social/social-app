export const ITEM_GAP = 8 // tokens.space.sm
export const MIN_ASPECT_RATIO = 2 / 3 // portrait limit
export const MAX_ASPECT_RATIO = 3 / 2 // landscape limit

/**
 * How long the carousel has to go without a scroll event before we consider it
 * at rest. Long enough to bridge the gaps between scroll events on a dropped
 * frame, short enough that the position badge feels responsive.
 */
export const REST_DELAY = 200
/** Fade duration for the position badge as the carousel starts and stops. */
export const REST_FADE_DURATION = 150
/** Resting opacity of the position badge, matching the ALT/crop badges. */
export const BADGE_OPACITY = 0.8
