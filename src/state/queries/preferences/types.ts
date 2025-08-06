import {
  type GndrFeedViewPreference,
  type GndrPreferences,
  type GndrThreadViewPreference,
} from '@gander-social-atproto/api'

export type UsePreferencesQueryResponse = Omit<
  GndrPreferences,
  'contentLabels' | 'feedViewPrefs' | 'feeds'
> & {
  feedViewPrefs: GndrFeedViewPreference & {
    lab_mergeFeedEnabled?: boolean
  }
  /**
   * User thread-view prefs, including newer fields that may not be typed yet.
   */
  threadViewPrefs: ThreadViewPreferences
  userAge: number | undefined
}

export type ThreadViewPreferences = Pick<
  GndrThreadViewPreference,
  'prioritizeFollowedUsers'
> & {
  sort: 'hotness' | 'oldest' | 'newest' | 'most-likes' | 'random' | string
  lab_treeViewEnabled?: boolean
}
