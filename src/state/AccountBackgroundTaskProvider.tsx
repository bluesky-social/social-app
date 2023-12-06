import React from 'react'

import {useSession} from '#/state/session'
import {useSyncPreferences} from '#/state/queries/preferences'

/**
 * Must live inside our "tree-reset" fragment in App.tsx, so that when the
 * current user changes, we clean up the intervals.
 */
export function AccountBackgroundTaskProvider() {
  const {currentAccount} = useSession()
  const syncPreferences = useSyncPreferences()
  const preferencesSyncInterval = React.useRef<NodeJS.Timeout | undefined>(
    undefined,
  )

  React.useEffect(() => {
    if (!currentAccount) return
    preferencesSyncInterval.current = setInterval(syncPreferences, 15e3)
    return () => clearInterval(preferencesSyncInterval.current)
  }, [currentAccount, syncPreferences])

  return null
}
