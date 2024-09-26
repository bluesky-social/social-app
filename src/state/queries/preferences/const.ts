import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {
  ThreadViewPreferences,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'

export const DEFAULT_HOME_FEED_PREFS: UsePreferencesQueryResponse['feedViewPrefs'] =
  {
    hideReplies: false,
    hideRepliesByUnfollowed: true, // Legacy, ignored
    hideRepliesByLikeCount: 0, // Legacy, ignored
    hideReposts: false,
    hideQuotePosts: false,
    lab_mergeFeedEnabled: false, // experimental
  }

export const DEFAULT_THREAD_VIEW_PREFS: ThreadViewPreferences = {
  sort: 'newest',
  prioritizeFollowedUsers: true,
  lab_treeViewEnabled: false,
}

export const DEFAULT_LOGGED_OUT_PREFERENCES: UsePreferencesQueryResponse = {
  birthDate: new Date('2022-11-17'), // TODO(pwi)
  moderationPrefs: {
    adultContentEnabled: false,
    labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
    labelers: [],
    mutedWords: [],
    hiddenPosts: [],
  },
  feedViewPrefs: DEFAULT_HOME_FEED_PREFS,
  threadViewPrefs: DEFAULT_THREAD_VIEW_PREFS,
  userAge: 13, // TODO(pwi)
  interests: {tags: []},
  savedFeeds: [],
  bskyAppState: {
    queuedNudges: [],
    activeProgressGuide: undefined,
    nuxs: [],
  },
}
