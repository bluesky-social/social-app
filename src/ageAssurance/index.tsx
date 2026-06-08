import {createContext, useCallback, useContext, useMemo} from 'react'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {restrictChatSettings} from '#/state/queries/messages/restrictChatSettings'
import {useAgent} from '#/state/session'
import {Provider as RedirectOverlayProvider} from '#/ageAssurance/components/RedirectOverlay'
import {
  AgeAssuranceServerDataProvider,
  useAgeAssuranceServerDataContext,
} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  useAgeAssuranceState,
  useOnAgeAssuranceAccessUpdate,
} from '#/ageAssurance/state'
import {
  AgeAssuranceAccess,
  type AgeAssuranceFlags,
  type AgeAssuranceState,
  AgeAssuranceStatus,
} from '#/ageAssurance/types'
import {
  computeAgeAssuranceFlags,
  useAgeAssuranceRegionConfigWithFallback,
} from '#/ageAssurance/util'

export {
  prefetchConfig as prefetchAgeAssuranceConfig,
  prefetchAgeAssuranceServerData,
  refetchServerState as refetchAgeAssuranceServerState,
  usePatchOtherRequiredData as usePatchAgeAssuranceOtherRequiredData,
  usePatchServerState as usePatchAgeAssuranceServerState,
} from '#/ageAssurance/data'
export {logger} from '#/ageAssurance/logger'
export {MIN_ACCESS_AGE} from '#/ageAssurance/util'

const AgeAssuranceStateContext = createContext<{
  Access: typeof AgeAssuranceAccess
  Status: typeof AgeAssuranceStatus
  state: AgeAssuranceState
  flags: AgeAssuranceFlags
}>({
  Access: AgeAssuranceAccess,
  Status: AgeAssuranceStatus,
  state: {
    lastInitiatedAt: undefined,
    status: AgeAssuranceStatus.Unknown,
    access: AgeAssuranceAccess.Full,
  },
  flags: {
    isAgeRestricted: false,
    adultContentDisabled: false,
    chatDisabled: false,
    groupChatDisabled: false,
    isDeclaredUnderAdultAge: false,
    isOverRegionMinAccessAge: false,
    isOverAppMinAccessAge: false,
  },
})

/**
 * THE MAIN AGE ASSURANCE CONTEXT HOOK
 *
 * Prefer this to using any of the lower-level data-provider hooks.
 */
export function useAgeAssurance() {
  return useContext(AgeAssuranceStateContext)
}

export function Provider({children}: {children: React.ReactNode}) {
  return (
    <AgeAssuranceServerDataProvider>
      <InnerProvider>
        <RedirectOverlayProvider>{children}</RedirectOverlayProvider>
      </InnerProvider>
    </AgeAssuranceServerDataProvider>
  )
}

function InnerProvider({children}: {children: React.ReactNode}) {
  const agent = useAgent()
  const state = useAgeAssuranceState()
  const {metadata} = useAgeAssuranceServerDataContext()
  const regionConfig = useAgeAssuranceRegionConfigWithFallback()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

  const handleAccessUpdate = useCallback(
    (s: AgeAssuranceState) => {
      const flags = computeAgeAssuranceFlags({
        state: s,
        regionConfig,
        metadata,
      })
      if (flags.isAgeRestricted) {
        void getAndRegisterPushToken({
          isAgeRestricted: true,
        })
      }
      if (flags.chatDisabled || flags.groupChatDisabled) {
        void restrictChatSettings({
          agent,
          restrictIncoming: flags.chatDisabled,
          restrictGroupInvites: flags.groupChatDisabled,
        })
      }
    },
    [agent, getAndRegisterPushToken, regionConfig, metadata],
  )
  useOnAgeAssuranceAccessUpdate(handleAccessUpdate)

  return (
    <AgeAssuranceStateContext.Provider
      value={useMemo(() => {
        const res = {
          Access: AgeAssuranceAccess,
          Status: AgeAssuranceStatus,
          state,
          flags: computeAgeAssuranceFlags({
            state,
            regionConfig,
            metadata,
          }),
        }
        logger.debug(`useAgeAssurance`, res)
        return res
      }, [state, metadata, regionConfig])}>
      {children}
    </AgeAssuranceStateContext.Provider>
  )
}
