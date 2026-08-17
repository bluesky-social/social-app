import {useEffect} from 'react'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {getCachedIsBetaUser, setCachedIsBetaUser} from './beta-user-cache'

/**
 * Caches `bskyAppState.isBetaUser` from preferences in memory and synchronous
 * device storage so analytics can read it at init (before beta-gated features
 * are evaluated). Scoped per account, since `isBetaUser` is account-specific:
 * a global cache would let one account's value leak into another after a
 * switch, until the new account's preferences loaded. Must be mounted below
 * `QueryProvider`, since the analytics providers that consume the cached value
 * sit above it.
 *
 * Lives outside `#/analytics` so that module never imports the preferences
 * query, which would create a circular import.
 */
export function BetaUserStorageSync() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  const {data: preferences} = usePreferencesQuery()
  const isBetaUser = preferences?.bskyAppState?.isBetaUser

  useEffect(() => {
    if (!did) return
    if (isBetaUser === undefined) return
    /*
     * Guard against a redundant write on every warm boot. Writing triggers the
     * cache change listener, which re-renders the analytics subtree.
     */
    if (getCachedIsBetaUser(did) === isBetaUser) return
    setCachedIsBetaUser(did, isBetaUser)
  }, [did, isBetaUser])

  return null
}
