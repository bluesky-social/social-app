import {useCallback, useMemo, useRef, useState} from 'react'
import {type AppBskyUnspeccedGetPostThreadV2} from '@atproto/api'
import {useFocusEffect} from '@react-navigation/native'
import debounce from 'lodash.debounce'

import {useCallOnce} from '#/lib/once'
import {
  usePreferencesQuery,
  useSetThreadViewPreferencesMutation,
} from '#/state/queries/preferences'
import {type ThreadViewPreferences} from '#/state/queries/preferences/types'
import {useAnalytics} from '#/analytics'
import {type Literal} from '#/types/utils'

export type ThreadSortOption = Literal<
  AppBskyUnspeccedGetPostThreadV2.QueryParams['sort'],
  string
>
export type ThreadViewOption = 'linear' | 'tree'
/**
 * All views supported by the thread screen. `reader` is a per-visit,
 * client-only view and is never persisted to server preferences.
 */
export type ThreadView = ThreadViewOption | 'reader'
export type ThreadPreferences = {
  isLoaded: boolean
  isSaving: boolean
  sort: ThreadSortOption
  setSort: (sort: string) => void
  view: ThreadView
  setView: (view: ThreadView) => void
  /**
   * The user's persisted view preference. Reader view is never persisted, so
   * this is always a concrete linear/tree value, e.g. for restoring the view
   * when exiting reader.
   */
  savedView: ThreadViewOption
}

export function useThreadPreferences({
  save,
  initialView,
}: {
  save?: boolean
  /**
   * Overrides the view for the first render, e.g. when deep-linking into
   * reader view. Server prefs sync still applies, but never clobbers an
   * active reader view.
   */
  initialView?: ThreadView
} = {}): ThreadPreferences {
  const ax = useAnalytics()
  const {data: preferences} = usePreferencesQuery()
  const serverPrefs = preferences?.threadViewPrefs
  const once = useCallOnce()

  /*
   * Create local state representations of server state
   */
  const [sort, setSort] = useState(normalizeSort(serverPrefs?.sort || 'top'))
  const [view, setView] = useState<ThreadView>(
    () =>
      initialView ??
      normalizeView({
        treeViewEnabled: !!serverPrefs?.lab_treeViewEnabled,
      }),
  )

  /**
   * If we get a server update, update local state
   */
  const [prevServerPrefs, setPrevServerPrefs] = useState(serverPrefs)
  const isLoaded = !!prevServerPrefs
  if (serverPrefs && prevServerPrefs !== serverPrefs) {
    setPrevServerPrefs(serverPrefs)

    /*
     * Update. Reader view is client-only, so a background preferences
     * refetch should not kick the user out of it.
     */
    setSort(normalizeSort(serverPrefs.sort))
    if (view !== 'reader') {
      setView(
        normalizeView({
          treeViewEnabled: !!serverPrefs.lab_treeViewEnabled,
        }),
      )
    }

    once(() => {
      ax.metric('thread:preferences:load', {
        sort: serverPrefs.sort,
        view: serverPrefs.lab_treeViewEnabled ? 'tree' : 'linear',
      })
    })
  }

  const userUpdatedPrefs = useRef(false)
  const {mutate, isPending: isSaving} = useSetThreadViewPreferencesMutation({
    onSuccess: (_data, prefs) => {
      ax.metric('thread:preferences:update', {
        sort: prefs.sort,
        view: prefs.lab_treeViewEnabled ? 'tree' : 'linear',
      })
    },
    onError: err => {
      ax.logger.error('useThreadPreferences failed to save', {
        safeMessage: err,
      })
    },
  })
  const savePrefs = useMemo(() => {
    return debounce(
      (prefs: ThreadViewPreferences) => {
        mutate(prefs)
      },
      2e3,
      {leading: true, trailing: true},
    )
  }, [mutate])

  // flush on leave screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        void savePrefs.flush()
      }
    }, [savePrefs]),
  )

  if (save && userUpdatedPrefs.current) {
    // Reader view is never persisted, and must not clobber the user's saved
    // linear/tree preference.
    if (view !== 'reader') {
      savePrefs({
        sort,
        lab_treeViewEnabled: view === 'tree',
      })
    }
    userUpdatedPrefs.current = false
  }

  const setSortWrapped = useCallback(
    (next: string) => {
      userUpdatedPrefs.current = true
      setSort(normalizeSort(next))
    },
    [setSort],
  )
  const setViewWrapped = useCallback(
    (next: ThreadView) => {
      userUpdatedPrefs.current = true
      setView(next)
    },
    [setView],
  )

  const savedView = normalizeView({
    treeViewEnabled: !!serverPrefs?.lab_treeViewEnabled,
  })

  return useMemo(
    () => ({
      isLoaded,
      isSaving,
      sort,
      setSort: setSortWrapped,
      view,
      setView: setViewWrapped,
      savedView,
    }),
    [isLoaded, isSaving, sort, setSortWrapped, view, setViewWrapped, savedView],
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
