import {createContext, useContext} from 'react'

import {useBreakpoints} from '#/alf'
import {IS_IOS} from '#/env'

const NativeHeaderContext = createContext(false)
NativeHeaderContext.displayName = 'NativeHeaderContext'

/**
 * Whether this screen uses the native header. When it does,
 * `Layout.Header.Outer` hands its contents to the native header instead of
 * rendering them, `Layout.Screen` leaves the status bar to it, and scroll
 * views scroll under it.
 */
export function useNativeHeader() {
  return useContext(NativeHeaderContext)
}

/**
 * Whether a screen that asked for the native header (the `nativeHeader` screen
 * option) gets it. iPhone only for now: on iPad the header would span the
 * whole window, not our center column, so tablets keep our own header.
 */
export function useNativeHeaderEnabled(requested: boolean | undefined) {
  const {gtMobile} = useBreakpoints()
  return IS_IOS && !!requested && !gtMobile
}

/**
 * Wraps each screen of a native stack, see `createNativeStackNavigatorWithAuth`.
 */
export function NativeHeaderProvider({
  requested,
  children,
}: {
  requested: boolean | undefined
  children: React.ReactNode
}) {
  const enabled = useNativeHeaderEnabled(requested)
  return (
    <NativeHeaderContext.Provider value={enabled}>
      {children}
    </NativeHeaderContext.Provider>
  )
}
