import {DISCOVER_FEED_URI} from '#/lib/constants'
import {atoms as a} from '#/alf'

/** Temporary destination until Atmosphere has its own feedback-only feed. */
export const DISCOVER_FEEDBACK = {
  feedUri: DISCOVER_FEED_URI,
  feedDid: 'did:web:discover.bsky.app',
}

/**
 * Horizontal inset owned by each Explore section. Derived from the ALF atom so
 * it stays in sync with `a.p_lg`.
 */
export const EXPLORE_SECTION_PADDING = a.p_lg.padding
