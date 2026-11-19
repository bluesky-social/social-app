import {DISCOVER_FEED_URI} from '#/lib/constants'
import {atoms as a} from '#/alf'

type FeedbackDestination = {
  /** Set to undefined to disable feedback and its menu options for this scope. */
  feedUri: string | undefined
  feedDid: string
}

/** Temporary destinations until Atmosphere has its own feedback-only feeds. */
export const DISCOVER_FEEDBACK: FeedbackDestination = {
  feedUri: DISCOVER_FEED_URI,
  feedDid: 'did:web:discover.bsky.app',
}
export const EXPLORE_ARTICLES_FEEDBACK: FeedbackDestination = {
  feedUri: DISCOVER_FEED_URI,
  feedDid: 'did:web:discover.bsky.app',
}
export const EXPLORE_PHOTOS_FEEDBACK: FeedbackDestination = {
  feedUri: DISCOVER_FEED_URI,
  feedDid: 'did:web:discover.bsky.app',
}

/**
 * Horizontal inset owned by each Explore section. Derived from the ALF atom so
 * it stays in sync with `a.p_lg`.
 */
export const EXPLORE_SECTION_PADDING = a.p_lg.padding
