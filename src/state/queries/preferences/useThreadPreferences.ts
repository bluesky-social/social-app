import {useCallback, useMemo, useState} from 'react'
import {type AppBskyUnspeccedGetPostThreadV2} from '@atproto/api'
import debounce from 'lodash.debounce'

import {logger} from '#/logger'
import {
  usePreferencesQuery,
  useSetThreadViewPreferencesMutation,
} from '#/state/queries/preferences'
import {type ThreadViewPreferences} from '#/state/queries/preferences/types'
import {type Literal} from '#/types/utils'

export type ThreadSortOption = Literal<
  AppBskyUnspeccedGetPostThreadV2.QueryParams['sort'],
  string
>
export type ThreadViewOption = 'linear' | 'tree'
export type ThreadPreferences = {
  isLoaded: boolean
  isSaving: boolean
  sort: ThreadSortOption
  setSort: (sort: string) => void
  view: ThreadViewOption
  setView: (view: ThreadViewOption) => void
  prioritizeFollowedUsers: boolean
  setPrioritizeFollowedUsers: (prioritize: boolean) => void
}

export function useThreadPreferences({
  save,
}: {save?: boolean} = {}): ThreadPreferences {
  const {data: preferences} = usePreferencesQuery()
  const serverPrefs = preferences?.threadViewPrefs

  /*
   * Create local state representations of server state
   */
  const [sort, setSort] = useState(normalizeSort(serverPrefs?.sort || 'top'))
  const [view, setView] = useState(
    normalizeView({
      treeViewEnabled: !!serverPrefs?.lab_treeViewEnabled,
    }),
  )
  const [prioritizeFollowedUsers, setPrioritizeFollowedUsers] = useState(
    !!serverPrefs?.prioritizeFollowedUsers,
  )

  /**
   * If we get a server update, update local state
   */
  const [prevServerPrefs, setPrevServerPrefs] = useState(serverPrefs)
  const isLoaded = !!prevServerPrefs
  if (serverPrefs && prevServerPrefs !== serverPrefs) {
    setPrevServerPrefs(serverPrefs)

    /*
     * Update
     */
    setSort(normalizeSort(serverPrefs.sort))
    setPrioritizeFollowedUsers(serverPrefs.prioritizeFollowedUsers)
    setView(
      normalizeView({
        treeViewEnabled: !!serverPrefs.lab_treeViewEnabled,
      }),
    )
  }

  const [isSaving, setIsSaving] = useState(false)
  const {mutateAsync} = useSetThreadViewPreferencesMutation()
  const savePrefs = useMemo(() => {
    return debounce(async (prefs: ThreadViewPreferences) => {
      try {
        setIsSaving(true)
        await mutateAsync(prefs)
      } catch (e) {
        logger.error('useThreadPreferences failed to save', {
          safeMessage: e,
        })
      } finally {
        setIsSaving(false)
      }
    }, 4e3)
  }, [mutateAsync])

  if (save && !isSaving) {
    if (
      serverPrefs?.sort !== sort ||
      serverPrefs?.prioritizeFollowedUsers !== prioritizeFollowedUsers ||
      serverPrefs?.lab_treeViewEnabled !== (view === 'tree' ? true : false)
    ) {
      savePrefs({
        sort,
        prioritizeFollowedUsers,
        lab_treeViewEnabled: view === 'tree',
      })
    }
  }

  /*
   * Wraped for easier migration
   */
  const setSortWrapped = useCallback(
    (next: string) => {
      setSort(normalizeSort(next))
    },
    [setSort],
  )

  return useMemo(
    () => ({
      isLoaded,
      isSaving,
      sort,
      setSort: setSortWrapped,
      prioritizeFollowedUsers,
      setPrioritizeFollowedUsers,
      view,
      setView,
    }),
    [
      isLoaded,
      isSaving,
      sort,
      setSortWrapped,
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
export function normalizeSort(sort: string): ThreadSortOption {
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
export function normalizeView({
  treeViewEnabled,
}: {
  treeViewEnabled: boolean
}): ThreadViewOption {
  return treeViewEnabled ? 'tree' : 'linear'
}
