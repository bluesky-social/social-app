import {
  UsePreferencesQueryResponse,
  ThreadViewPreferences,
} from '#/state/queries/preferences/types'

export const DEFAULT_HOME_FEED_PREFS: UsePreferencesQueryResponse['homeFeed'] =
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
