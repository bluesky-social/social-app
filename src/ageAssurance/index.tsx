import {createContext, useCallback, useContext, useMemo} from 'react'

import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
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
    hasDeclaredAge: false,
    isDeclaredUnderAdultAge: false,
    isOverRegionMinAccessAge: false,
    isOverAppMinAccessAge: false,
    allowsDeviceVerification: false,
    hasSharedDeviceSignals: false,
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
  const state = useAgeAssuranceState()
  const {metadata, deviceSignals} = useAgeAssuranceServerDataContext()
  const regionConfig = useAgeAssuranceRegionConfigWithFallback()
  const getAndRegisterPushToken = useGetAndRegisterPushToken()

  const handleAccessUpdate = useCallback(
    (s: AgeAssuranceState) => {
      const flags = computeAgeAssuranceFlags({
        state: s,
        regionConfig,
        metadata,
        deviceSignals,
      })
      if (flags.isAgeRestricted) {
        void getAndRegisterPushToken({
          isAgeRestricted: true,
        })
      }
    },
    [getAndRegisterPushToken, regionConfig, metadata, deviceSignals],
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
            deviceSignals,
          }),
        }
        logger.debug(`useAgeAssurance`, res)
        return res
      }, [state, metadata, regionConfig, deviceSignals])}>
      {children}
    </AgeAssuranceStateContext.Provider>
  )
}
