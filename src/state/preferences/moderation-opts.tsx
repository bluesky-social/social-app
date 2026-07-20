import {createContext, useContext, useMemo} from 'react'
import {Client} from '@atproto/lex'
import {type ModerationOpts} from '@bsky.app/sdk/moderation'

import {useHiddenPosts, useLabelDefinitions} from '#/state/preferences'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/const'
import {useSession} from '#/state/session'
import {usePreferencesQuery} from '../queries/preferences'

export const moderationOptsContext = createContext<ModerationOpts | undefined>(
  undefined,
)
moderationOptsContext.displayName = 'ModerationOptsContext'

// used in the moderation state devtool
export const moderationOptsOverrideContext = createContext<
  ModerationOpts | undefined
>(undefined)
moderationOptsOverrideContext.displayName = 'ModerationOptsOverrideContext'

export function useModerationOpts() {
  return useContext(moderationOptsContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const override = useContext(moderationOptsOverrideContext)
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const {labelDefs} = useLabelDefinitions()
  const hiddenPosts = useHiddenPosts() // TODO move this into pds-stored prefs

  const userDid = currentAccount?.did
  const moderationPrefs = prefs.data?.moderationPrefs
  const value = useMemo<ModerationOpts | undefined>(() => {
    if (override) {
      return override
    }
    if (!moderationPrefs) {
      return undefined
    }
    return {
      /*
       * `did`/`hiddenPosts` come from persisted storage typed as plain
       * `string`, so brand them to the SDK's `DidString`/`AtUriString` slots.
       */
      userDid: userDid as ModerationOpts['userDid'],
      prefs: {
        ...moderationPrefs,
        labelers: moderationPrefs.labelers.length
          ? moderationPrefs.labelers
          : Client.appLabelers.map(did => ({
              did,
              labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
            })),
        hiddenPosts: (hiddenPosts ||
          []) as ModerationOpts['prefs']['hiddenPosts'],
      },
      labelDefs,
    }
  }, [override, userDid, labelDefs, moderationPrefs, hiddenPosts])

  return (
    <moderationOptsContext.Provider value={value}>
      {children}
    </moderationOptsContext.Provider>
  )
}
