import {
  UsePreferencesQueryResponse,
  ThreadViewPreferences,
} from '#/state/queries/preferences/types'

export const DEFAULT_HOME_FEED_PREFS: UsePreferencesQueryResponse['feedViewPrefs'] =
  {
    hideReplies: false,
    hideRepliesByUnfollowed: false,
    hideRepliesByLikeCount: 0,
    hideReposts: false,
    hideQuotePosts: false,
    lab_mergeFeedEnabled: false, // experimental
  }

export const DEFAULT_THREAD_VIEW_PREFS: ThreadViewPreferences = {
  sort: 'newest',
  prioritizeFollowedUsers: true,
  lab_treeViewEnabled: false,
}

const DEFAULT_PROD_FEED_PREFIX = (rkey: string) =>
  `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${rkey}`
export const DEFAULT_PROD_FEEDS = {
  pinned: [DEFAULT_PROD_FEED_PREFIX('whats-hot')],
  saved: [DEFAULT_PROD_FEED_PREFIX('whats-hot')],
}
