import {DEFAULT_LABEL_SETTINGS} from '@bsky.app/sdk'

import {
  type ThreadViewPreferences,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences/types'

/**
 * More strict than our default settings for logged in users.
 *
 * Defined here rather than in `./moderation` to avoid a module-init cycle:
 * `moderation` imports `./index`, which re-exports this file, so reading the
 * value from `moderation` at init time lands in its temporal dead zone.
 */
export const DEFAULT_LOGGED_OUT_LABEL_PREFERENCES: typeof DEFAULT_LABEL_SETTINGS =
  Object.fromEntries(
    Object.entries(DEFAULT_LABEL_SETTINGS).map(([key, _pref]) => [key, 'hide']),
  )

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
  sort: 'hotness',
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
    isBetaUser: undefined,
  },
  postInteractionSettings: {
    threadgateAllowRules: undefined,
    postgateEmbeddingRules: [],
  },
  verificationPrefs: {
    hideBadges: false,
  },
  liveEventPreferences: {
    hideAllFeeds: false,
    hiddenFeedIds: [],
  },
}
