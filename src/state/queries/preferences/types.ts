import {
  BskyFeedViewPreference,
  BskyPreferences,
  BskyThreadViewPreference,
} from '@atproto/api'

export type UsePreferencesQueryResponse = Omit<
  BskyPreferences,
  'contentLabels' | 'feedViewPrefs' | 'feeds'
> & {
  feedViewPrefs: BskyFeedViewPreference & {
    lab_mergeFeedEnabled?: boolean
  }
  /**
   * User thread-view prefs, including newer fields that may not be typed yet.
   */
  threadViewPrefs: ThreadViewPreferences
  userAge: number | undefined
}

export type ThreadViewPreferences = Pick<
  BskyThreadViewPreference,
  'prioritizeFollowedUsers'
> & {
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  lab_treeViewEnabled?: boolean
}
