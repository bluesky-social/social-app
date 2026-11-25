import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {atoms as a} from '#/alf'

type FeedbackDestination = {
  /** Set to undefined to disable feedback and its menu options for this scope. */
  feedUri: string | undefined
  feedDid: string
}

/** Feedback-only feeds for Atmosphere's recommendation surfaces. */
export const DISCOVER_FEEDBACK: FeedbackDestination = {
  feedUri: PROD_DEFAULT_FEED('atmosphere-activity'),
  feedDid: 'did:web:discover.bsky.app',
}
export const EXPLORE_ARTICLES_FEEDBACK: FeedbackDestination = {
  feedUri: PROD_DEFAULT_FEED('atmosphere-articles'),
  feedDid: 'did:web:discover.bsky.app',
}
export const EXPLORE_PHOTOS_FEEDBACK: FeedbackDestination = {
  feedUri: PROD_DEFAULT_FEED('atmosphere-galleries'),
  feedDid: 'did:web:discover.bsky.app',
}

/**
 * Horizontal inset owned by each Explore section. Derived from the ALF atom so
 * it stays in sync with `a.p_lg`.
 */
export const EXPLORE_SECTION_PADDING = a.p_lg.padding
