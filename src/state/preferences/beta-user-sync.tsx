import {useEffect} from 'react'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {device} from '#/storage'

/**
 * Caches `bskyAppState.isBetaUser` from preferences into synchronous device
 * storage so analytics can read it at init (before beta-gated features are
 * evaluated). Must be mounted below `QueryProvider`, since the analytics
 * providers that consume the cached value sit above it.
 *
 * Lives outside `#/analytics` so that module never imports the preferences
 * query, which would create a circular import.
 */
export function BetaUserStorageSync() {
  const {data: preferences} = usePreferencesQuery()
  const isBetaUser = preferences?.bskyAppState?.isBetaUser

  useEffect(() => {
    if (isBetaUser === undefined) return
    /*
     * Guard against a redundant write on every warm boot. Writing triggers the
     * storage change listener, which remounts the analytics subtree.
     */
    if (device.get(['isBetaUser']) === isBetaUser) return
    device.set(['isBetaUser'], isBetaUser)
  }, [isBetaUser])

  return null
}
