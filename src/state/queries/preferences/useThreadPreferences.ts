import {useMemo, useState} from 'react'
import {type AppBskyUnspeccedGetPostThreadV2} from '@atproto/api'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {type Literal} from '#/types/utils'

export type ThreadSortOption = Literal<
  AppBskyUnspeccedGetPostThreadV2.QueryParams['sort'],
  string
>
export type ThreadViewOption = 'linear' | 'tree'
export type ThreadPreferences = {
  isLoaded: boolean
  sort: ThreadSortOption
  setSort: (sort: ThreadSortOption) => void
  view: ThreadViewOption
  setView: (view: ThreadViewOption) => void
  prioritizeFollowedUsers: boolean
  setPrioritizeFollowedUsers: (prioritize: boolean) => void
}

export function useThreadPreferences(): ThreadPreferences {
  const {data: preferences} = usePreferencesQuery()
  const nextThreadPreferences = preferences?.threadViewPrefs

  /*
   * Create local state representations of server state
   */
  const [sort, setSort] = useState(
    migrateFromSortV1(nextThreadPreferences?.sort || 'top'),
  )
  const [view, setView] = useState(
    computeView({
      treeViewEnabled: !!nextThreadPreferences?.lab_treeViewEnabled,
    }),
  )
  const [prioritizeFollowedUsers, setPrioritizeFollowedUsers] = useState(
    !!nextThreadPreferences?.prioritizeFollowedUsers,
  )

  /**
   * Cache existing and if we get a server update, reset local state
   */
  const [prevServerPrefs, setPrevServerPrefs] = useState(nextThreadPreferences)
  if (nextThreadPreferences && prevServerPrefs !== nextThreadPreferences) {
    setPrevServerPrefs(nextThreadPreferences)

    /*
     * Reset
     */
    setSort(migrateFromSortV1(nextThreadPreferences.sort))
    setPrioritizeFollowedUsers(nextThreadPreferences.prioritizeFollowedUsers)
    setView(
      computeView({
        treeViewEnabled: !!nextThreadPreferences.lab_treeViewEnabled,
      }),
    )
  }

  const isLoaded = !!prevServerPrefs

  return useMemo(
    () => ({
      isLoaded,
      sort,
      setSort,
      prioritizeFollowedUsers,
      setPrioritizeFollowedUsers,
      view,
      setView,
    }),
    [
      isLoaded,
      sort,
      setSort,
      prioritizeFollowedUsers,
      setPrioritizeFollowedUsers,
      view,
      setView,
    ],
  )
}

/**
 * Migrates user thread preferences from the old sort values to V2
 */
function migrateFromSortV1(sort: string): ThreadSortOption {
  switch (sort) {
    case 'oldest':
      return 'oldest'
    case 'newest':
      return 'newest'
    default:
      return 'top'
  }
}

/**
 * Transforms existing treeViewEnabled preference into a ThreadViewOption
 */
function computeView({
  treeViewEnabled,
}: {
  treeViewEnabled: boolean
}): ThreadViewOption {
  return treeViewEnabled ? 'tree' : 'linear'
}
