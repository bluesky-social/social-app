import {
  BskyPreferences,
  LabelPreference,
  BskyThreadViewPreference,
} from '@atproto/api'

export type ConfigurableLabelGroup =
  | 'nsfw'
  | 'nudity'
  | 'suggestive'
  | 'gore'
  | 'hate'
  | 'spam'
  | 'impersonation'
export type LabelGroup =
  | ConfigurableLabelGroup
  | 'illegal'
  | 'always-filter'
  | 'always-warn'
  | 'unknown'

export type UsePreferencesQueryResponse = Omit<
  BskyPreferences,
  'contentLabels'
> & {
  /*
   * Content labels previously included 'show', which has been deprecated in
   * favor of 'ignore'. The API can return legacy data from the database, and
   * we clean up the data in `usePreferencesQuery`.
   */
  contentLabels: Record<ConfigurableLabelGroup, LabelPreference>
  homeFeed: BskyPreferences['feedViewPrefs']['home']
  /**
   * User thread-view prefs, including newer fields that may not be typed yet.
   */
  threadViewPrefs: ThreadViewPreferences
  userAge: number | undefined
}

export type ThreadViewPreferences = Omit<BskyThreadViewPreference, 'sort'> & {
  sort: 'oldest' | 'newest' | 'most-likes' | 'random' | string
  lab_treeViewEnabled: boolean
}
