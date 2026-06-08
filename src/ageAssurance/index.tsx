import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {useAgent} from '#/state/session'
import {Provider as RedirectOverlayProvider} from '#/ageAssurance/components/RedirectOverlay'
import {
  AgeAssuranceDataProvider,
  useAgeAssuranceDataContext,
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
  maybeRestrictChatSettings,
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
    adultContentDisabled: false,
    chatDisabled: false,
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
    <AgeAssuranceDataProvider>
      <InnerProvider>
        <RedirectOverlayProvider>{children}</RedirectOverlayProvider>
      </InnerProvider>
    </AgeAssuranceDataProvider>
  )
}

function InnerProvider({children}: {children: React.ReactNode}) {
  const agent = useAgent()
  const state = useAgeAssuranceState()
  const {data} = useAgeAssuranceDataContext()
  const config = useAgeAssuranceRegionConfigWithFallback()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

  const handleAccessUpdate = useCallback(
    (s: AgeAssuranceState) => {
      const isAgeRestricted = s.access !== AgeAssuranceAccess.Full
      if (isAgeRestricted) {
        void getAndRegisterPushToken({isAgeRestricted})
        maybeRestrictChatSettings({agent})
      }
    },
    [agent, getAndRegisterPushToken],
  )
  useOnAgeAssuranceAccessUpdate(handleAccessUpdate)

  useEffect(() => {
    logger.debug(`useAgeAssuranceState`, {state})
  }, [state])

  return (
    <AgeAssuranceStateContext.Provider
      value={useMemo(() => {
        return {
          Access: AgeAssuranceAccess,
          Status: AgeAssuranceStatus,
          state,
          flags: computeAgeAssuranceFlags({
            state,
            config,
            data,
          }),
        }
      }, [state, data, config])}>
      {children}
    </AgeAssuranceStateContext.Provider>
  )
}
