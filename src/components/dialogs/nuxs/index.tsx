import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {Nux, useNuxs, useResetNuxs, useSaveNux} from '#/state/queries/nuxs'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {type SessionAccount, useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import * as Dialog from '#/components/Dialog'
import {
  DraftsAnnouncement,
  enabled as isDraftsAnnouncementEnabled,
} from '#/components/dialogs/nuxs/DraftsAnnouncement'
import {
  enabled as isInviteFriendsAnnouncementEnabled,
  InviteFriendsAnnouncement,
} from '#/components/dialogs/nuxs/InviteFriendsAnnouncement'
import {isSnoozed, snooze, unsnooze} from '#/components/dialogs/nuxs/snoozing'
import {type EnabledCheckProps} from '#/components/dialogs/nuxs/utils'
import {useAnalytics} from '#/analytics'
import {InviteFriendsDialog} from '#/features/inviteFriends'
import {useGeolocation} from '#/geolocation'

type Context = {
  activeNux: Nux | undefined
  dismissActiveNux: () => void
  /**
   * Opens the invite-friends dialog. It is mounted persistently by NuxDialogs
   * (not inside the announcement NUX) so it survives the announcement being
   * dismissed - the native bottom sheet cannot hand off between two sheets
   * mounted in the same subtree.
   */
  openInviteFriends: () => void
}

const queuedNuxs: {
  id: Nux
  enabled?: (props: EnabledCheckProps) => boolean
}[] = [
  {
    id: Nux.DraftsAnnouncement,
    enabled: isDraftsAnnouncementEnabled,
  },
  {
    id: Nux.InviteFriendsAnnouncement,
    enabled: isInviteFriendsAnnouncementEnabled,
  },
]

const Context = createContext<Context>({
  activeNux: undefined,
  dismissActiveNux: () => {},
  openInviteFriends: () => {},
})
Context.displayName = 'NuxDialogContext'

export function useNuxDialogContext() {
  return useContext(Context)
}

export function NuxDialogs() {
  const {currentAccount} = useSession()
  const {data: preferences} = usePreferencesQuery()
  const {data: profile} = useProfileQuery({
    did: currentAccount?.did,
    staleTime: STALE.INFINITY, // createdAt isn't gonna change
  })
  const onboardingActive = useOnboardingState().isActive

  const isLoading =
    onboardingActive ||
    !currentAccount ||
    !preferences ||
    !profile ||
    // Profile isn't legit ready until createdAt is a real date.
    !profile.createdAt ||
    profile.createdAt === '0001-01-01T00:00:00.000Z' // TODO: Fix this in AppView.

  return !isLoading ? (
    <Inner
      currentAccount={currentAccount}
      currentProfile={profile}
      preferences={preferences}
    />
  ) : null
}

function Inner({
  currentAccount,
  currentProfile,
  preferences,
}: {
  currentAccount: SessionAccount
  currentProfile: AppBskyActorDefs.ProfileViewDetailed
  preferences: UsePreferencesQueryResponse
}) {
  const ax = useAnalytics()
  const geolocation = useGeolocation()
  const {nuxs} = useNuxs()
  const [snoozed, setSnoozed] = useState(() => {
    return isSnoozed()
  })
  const [activeNux, setActiveNux] = useState<Nux | undefined>()
  const {mutateAsync: saveNux} = useSaveNux()
  const {mutate: resetNuxs} = useResetNuxs()
  const inviteFriendsControl = Dialog.useDialogControl()

  const snoozeNuxDialog = useCallback(() => {
    snooze()
    setSnoozed(true)
  }, [setSnoozed])

  const dismissActiveNux = useCallback(() => {
    if (!activeNux) return
    setActiveNux(undefined)
  }, [activeNux, setActiveNux])

  if (__DEV__ && typeof window !== 'undefined') {
    // @ts-ignore
    window.clearNuxDialog = (id: Nux) => {
      if (!__DEV__ || !id) return
      resetNuxs([id])
      unsnooze()
    }
  }

  useEffect(() => {
    if (snoozed) return // comment this out to test
    if (!nuxs) return

    for (const {id, enabled} of queuedNuxs) {
      const nux = nuxs.find(nux => nux.id === id)

      // check if completed first
      if (nux && nux.completed) {
        continue // comment this out to test
      }

      // then check gate (track exposure)
      if (
        enabled &&
        !enabled({
          features: ax.features,
          currentAccount,
          currentProfile,
          preferences,
          geolocation,
        })
      ) {
        continue
      }

      logger.debug(`NUX dialogs: activating '${id}' NUX`)

      // we have a winner
      setActiveNux(id)

      // immediately snooze for a day
      snoozeNuxDialog()

      // immediately update remote data (affects next reload)
      saveNux({
        id,
        completed: true,
        data: undefined,
      }).catch(e => {
        logger.error(`NUX dialogs: failed to upsert '${id}' NUX`, {
          safeMessage: e.message,
        })
      })

      break
    }
  }, [
    ax.features,
    nuxs,
    snoozed,
    snoozeNuxDialog,
    saveNux,
    currentAccount,
    currentProfile,
    preferences,
    geolocation,
  ])

  const ctx = useMemo(() => {
    return {
      activeNux,
      dismissActiveNux,
      openInviteFriends: () => {
        ax.metric('invite:dialog:open', {logContext: 'NuxAnnouncement'})
        inviteFriendsControl.open()
      },
    }
  }, [ax, activeNux, dismissActiveNux, inviteFriendsControl])

  return (
    <Context.Provider value={ctx}>
      {/*For example, activeNux === Nux.NeueTypography && <NeueTypography />*/}
      {activeNux === Nux.DraftsAnnouncement && <DraftsAnnouncement />}
      {activeNux === Nux.InviteFriendsAnnouncement && (
        <InviteFriendsAnnouncement />
      )}
      {/*
        Mounted persistently (not inside the announcement) so the invite dialog
        survives the announcement NUX being dismissed during the "Try it"
        handoff.
      */}
      <InviteFriendsDialog control={inviteFriendsControl} />
    </Context.Provider>
  )
}
