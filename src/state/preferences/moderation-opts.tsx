import React, {createContext, useContext, useMemo} from 'react'
import {BSKY_LABELER_DID, ModerationOpts} from '@atproto/api'

import {useHiddenPosts, useLabelDefinitions} from '#/state/preferences'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/moderation'
import {useSession} from '#/state/session'
import {usePreferencesQuery} from '../queries/preferences'

export const moderationOptsContext = createContext<ModerationOpts | undefined>(
  undefined,
)

// used in the moderation state devtool
export const moderationOptsOverrideContext = createContext<
  ModerationOpts | undefined
>(undefined)

export function useModerationOpts() {
  return useContext(moderationOptsContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const override = useContext(moderationOptsOverrideContext)
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const {labelDefs} = useLabelDefinitions()
  const hiddenPosts = useHiddenPosts() // TODO move this into pds-stored prefs

  const value = useMemo<ModerationOpts | undefined>(() => {
    console.log('hit')
    if (override) {
      return override
    }
    if (!prefs.data) {
      return
    }
    return {
      userDid: currentAccount?.did,
      prefs: {
        ...prefs.data.moderationPrefs,
        labelers: prefs.data.moderationPrefs.labelers.length
          ? prefs.data.moderationPrefs.labelers
          : [
              {
                did: BSKY_LABELER_DID,
                labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
              },
            ],
        hiddenPosts: hiddenPosts || [],
      },
      labelDefs,
    }
  }, [override, currentAccount, labelDefs, prefs.data, hiddenPosts])

  return (
    <moderationOptsContext.Provider value={value}>
      {children}
    </moderationOptsContext.Provider>
  )
}
