import {createContext, useContext, useMemo} from 'react'
import {Client} from '@atproto/lex'
import {type ModerationOpts} from '@bsky/sdk/moderation'

import {useHiddenPosts, useLabelDefinitions} from '#/state/preferences'
import {DEFAULT_LOGGED_OUT_LABEL_PREFERENCES} from '#/state/queries/preferences/const'
import {useSession} from '#/state/session'
import {usePreferencesQuery} from '../queries/preferences'

export const moderationOptsContext = createContext<ModerationOpts | undefined>(
  undefined,
)
moderationOptsContext.displayName = 'ModerationOptsContext'

/**
 * Replaces the viewer's moderation settings for everything below it. Used by
 * the moderation playground (`DebugMod`) to render content under made-up
 * settings.
 */
export const moderationOptsOverrideContext = createContext<
  ModerationOpts | undefined
>(undefined)
moderationOptsOverrideContext.displayName = 'ModerationOptsOverrideContext'

/**
 * The viewer's moderation settings, or the nearest override. The override is
 * read here rather than in `Provider`, because `Provider` sits at the root,
 * above any override.
 */
export function useModerationOpts() {
  const override = useContext(moderationOptsOverrideContext)
  const moderationOpts = useContext(moderationOptsContext)
  return override ?? moderationOpts
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {currentAccount} = useSession()
  const prefs = usePreferencesQuery()
  const {labelDefs} = useLabelDefinitions()
  const hiddenPosts = useHiddenPosts() // TODO move this into pds-stored prefs

  const userDid = currentAccount?.did
  const moderationPrefs = prefs.data?.moderationPrefs
  const value = useMemo<ModerationOpts | undefined>(() => {
    if (!moderationPrefs) {
      return undefined
    }
    return {
      userDid,
      prefs: {
        ...moderationPrefs,
        labelers: moderationPrefs.labelers.length
          ? moderationPrefs.labelers
          : Client.appLabelers.map(did => ({
              did,
              labels: DEFAULT_LOGGED_OUT_LABEL_PREFERENCES,
            })),
        /*
         * `hiddenPosts` comes from persisted storage typed as plain `string`,
         * so brand it to the SDK's `AtUriString` slot.
         */
        hiddenPosts: (hiddenPosts ||
          []) as ModerationOpts['prefs']['hiddenPosts'],
      },
      labelDefs,
    }
  }, [userDid, labelDefs, moderationPrefs, hiddenPosts])

  return (
    <moderationOptsContext.Provider value={value}>
      {children}
    </moderationOptsContext.Provider>
  )
}
