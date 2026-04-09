import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {restrictChatSettings} from '#/state/queries/messages/actor-declaration'
import {useAgent} from '#/state/session'
import {Provider as RedirectOverlayProvider} from '#/ageAssurance/components/RedirectOverlay'
import {
  AgeAssuranceDataProvider,
  getDidFromAgentSession,
  getOtherRequiredDataFromCache,
  useAgeAssuranceDataContext,
} from '#/ageAssurance/data'
import {logger} from '#/ageAssurance/logger'
import {
  useAgeAssuranceState,
  useOnAgeAssuranceAccessUpdate,
} from '#/ageAssurance/state'
import {
  AgeAssuranceAccess,
  type AgeAssuranceState,
  AgeAssuranceStatus,
} from '#/ageAssurance/types'
import {
  isUnderAge,
  MIN_ACCESS_AGE,
  useAgeAssuranceRegionConfigWithFallback,
} from '#/ageAssurance/util'

export {
  prefetchConfig as prefetchAgeAssuranceConfig,
  prefetchAgeAssuranceData,
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
  flags: {
    adultContentDisabled: boolean
    chatDisabled: boolean
    isOverRegionMinAccessAge: boolean
    isOverAppMinAccessAge: boolean
  }
}>({
  Access: AgeAssuranceAccess,
  Status: AgeAssuranceStatus,
  state: {
    lastInitiatedAt: undefined,
    status: AgeAssuranceStatus.Unknown,
    access: AgeAssuranceAccess.Full,
  },
  flags: {
    adultContentDisabled: false,
    chatDisabled: false,
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
    <AgeAssuranceDataProvider>
      <InnerProvider>
        <RedirectOverlayProvider>{children}</RedirectOverlayProvider>
      </InnerProvider>
    </AgeAssuranceDataProvider>
  )
}

function InnerProvider({children}: {children: React.ReactNode}) {
  const agent = useAgent()
  const {flags} = useAgeAssurance()
  const state = useAgeAssuranceState()
  const {data} = useAgeAssuranceDataContext()
  const config = useAgeAssuranceRegionConfigWithFallback()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

  const handleAccessUpdate = useCallback(
    (s: AgeAssuranceState) => {
      void getAndRegisterPushToken({
        isAgeRestricted: s.access !== AgeAssuranceAccess.Full,
      })
    },
    [getAndRegisterPushToken],
  )
  useOnAgeAssuranceAccessUpdate(handleAccessUpdate)

  useEffect(() => {
    logger.debug(`useAgeAssuranceState`, {state})
  }, [state])

  const ctx = useMemo(() => {
    const chatDisabled = state.access !== AgeAssuranceAccess.Full
    const isUnderAdultAge = data?.birthdate
      ? isUnderAge(data.birthdate, 18)
      : true
    const isOverRegionMinAccessAge = data?.birthdate
      ? !isUnderAge(data.birthdate, config.minAccessAge)
      : false
    const isOverAppMinAccessAge = data?.birthdate
      ? !isUnderAge(data.birthdate, MIN_ACCESS_AGE)
      : false
    const adultContentDisabled =
      state.access !== AgeAssuranceAccess.Full || isUnderAdultAge
    return {
      Access: AgeAssuranceAccess,
      Status: AgeAssuranceStatus,
      state,
      flags: {
        adultContentDisabled,
        chatDisabled,
        isOverRegionMinAccessAge,
        isOverAppMinAccessAge,
      },
    }
  }, [state, data, config])

  useEffect(() => {
    const updateChatRecord = async () => {
      const did = getDidFromAgentSession(agent)
      // If chat is disabled...
      if (did && flags.chatDisabled) {
        const data = getOtherRequiredDataFromCache({did})
        const allowIncoming = data?.actorDeclaration?.allowIncoming
        // ...update the chat setting record if allowIncoming is not already 'none'.
        if (allowIncoming === 'none') {
          return
        }
        await restrictChatSettings({agent, did})
      }
    }
    void updateChatRecord()
  }, [agent, flags.chatDisabled])

  return (
    <AgeAssuranceStateContext.Provider value={ctx}>
      {children}
    </AgeAssuranceStateContext.Provider>
  )
}
