import {
  BskyPreferences,
  LabelPreference,
  BskyThreadViewPreference,
  BskyFeedViewPreference,
} from '@atproto/api'

export const configurableAdultLabelGroups = [
  'nsfw',
  'nudity',
  'suggestive',
  'gore',
] as const

export const configurableOtherLabelGroups = [
  'hate',
  'spam',
  'impersonation',
] as const

export const configurableLabelGroups = [
  ...configurableAdultLabelGroups,
  ...configurableOtherLabelGroups,
] as const
export type ConfigurableLabelGroup = (typeof configurableLabelGroups)[number]

export type LabelGroup =
  | ConfigurableLabelGroup
  | 'illegal'
  | 'always-filter'
  | 'always-warn'
  | 'unknown'

export type UsePreferencesQueryResponse = Omit<
  BskyPreferences,
  'contentLabels' | 'feedViewPrefs' | 'feeds'
> & {
  /*
   * Content labels previously included 'show', which has been deprecated in
   * favor of 'ignore'. The API can return legacy data from the database, and
   * we clean up the data in `usePreferencesQuery`.
   */
  contentLabels: Record<ConfigurableLabelGroup, LabelPreference>
  feedViewPrefs: BskyFeedViewPreference & {
    lab_mergeFeedEnabled?: boolean
  }
  /**
   * User thread-view prefs, including newer fields that may not be typed yet.
   */
  threadViewPrefs: ThreadViewPreferences
  userAge: number | undefined
  feeds: Required<BskyPreferences['feeds']> & {
    unpinned: string[]
  }
}

export type ThreadViewPreferences = Pick<
  BskyThreadViewPreference,
  'prioritizeFollowedUsers'
> & {
  sort: 'oldest' | 'newest' | 'most-likes' | 'random' | string
  lab_treeViewEnabled?: boolean
}
