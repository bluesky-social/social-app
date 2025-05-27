import {useMemo, useState} from 'react'

import {usePreferencesQuery} from '#/state/queries/preferences'

export function useThreadPreferences() {
  const {data: preferences} = usePreferencesQuery()
  const nextThreadPreferences = preferences?.threadViewPrefs

  /*
   * Create local state representations of server state
   */
  const [sortReplies, setSortReplies] = useState(
    nextThreadPreferences?.sort ?? 'hotness',
  )
  const [prioritizeFollowedUsers, setPrioritizeFollowedUsers] = useState(
    !!nextThreadPreferences?.prioritizeFollowedUsers,
  )
  const [treeViewEnabled, setTreeViewEnabled] = useState(
    !!nextThreadPreferences?.lab_treeViewEnabled,
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
    setSortReplies(nextThreadPreferences.sort)
    setPrioritizeFollowedUsers(nextThreadPreferences.prioritizeFollowedUsers)
    setTreeViewEnabled(!!nextThreadPreferences.lab_treeViewEnabled)
  }

  const isLoaded = !!prevServerPrefs

  return useMemo(
    () => ({
      isLoaded,
      sortReplies,
      setSortReplies,
      prioritizeFollowedUsers,
      setPrioritizeFollowedUsers,
      treeViewEnabled,
      setTreeViewEnabled,
    }),
    [
      isLoaded,
      sortReplies,
      setSortReplies,
      prioritizeFollowedUsers,
      setPrioritizeFollowedUsers,
      treeViewEnabled,
      setTreeViewEnabled,
    ],
  )
}
