import {
  UsePreferencesQueryResponse,
  ThreadViewPreferences,
} from '#/state/queries/preferences/types'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'

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

export const DEFAULT_LOGGED_OUT_PREFERENCES: UsePreferencesQueryResponse = {
  birthDate: new Date('2022-11-17'), // TODO(pwi)
  adultContentEnabled: false,
  feeds: {
    saved: [],
    pinned: [],
    unpinned: [],
  },
  // labels are undefined until set by user
  contentLabels: {
    nsfw: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.nsfw,
    nudity: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.nudity,
    suggestive: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.suggestive,
    gore: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.gore,
    hate: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.hate,
    spam: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.spam,
    impersonation: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES.impersonation,
  },
  feedViewPrefs: DEFAULT_HOME_FEED_PREFS,
  threadViewPrefs: DEFAULT_THREAD_VIEW_PREFS,
  userAge: 13, // TODO(pwi)
  interests: {tags: []},
}
