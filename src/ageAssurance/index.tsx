import {createContext, useCallback, useContext, useEffect, useMemo} from 'react'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
import {Provider as RedirectOverlayProvider} from '#/ageAssurance/components/RedirectOverlay'
import {AgeAssuranceDataProvider} from '#/ageAssurance/data'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
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
  const state = useAgeAssuranceState()
  const {data} = useAgeAssuranceDataContext()
  const config = useAgeAssuranceRegionConfigWithFallback()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

  const handleAccessUpdate = useCallback(
    (s: AgeAssuranceState) => {
      getAndRegisterPushToken({
        isAgeRestricted: s.access !== AgeAssuranceAccess.Full,
      })
    },
    [getAndRegisterPushToken],
  )
  useOnAgeAssuranceAccessUpdate(handleAccessUpdate)

  useEffect(() => {
    logger.debug(`useAgeAssuranceState`, {state})
  }, [state])

  return (
    <AgeAssuranceStateContext.Provider
      value={useMemo(() => {
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
      }, [state, data, config])}>
      {children}
    </AgeAssuranceStateContext.Provider>
  )
}
