import {createContext, useContext} from 'react'
/*
 * A dependency of `@react-navigation/native-stack`, which provides this
 * context. Not in our package.json yet.
 */
import {HeaderHeightContext} from '@react-navigation/elements'

import {useBreakpoints} from '#/alf'
import {useDialogContext} from '#/components/Dialog/context'
import {IS_IOS} from '#/env'

const NativeHeaderContext = createContext(false)
NativeHeaderContext.displayName = 'NativeHeaderContext'

/**
 * Whether this screen uses the native header. When it does,
 * `Layout.Header.Outer` hands its contents to the native header instead of
 * rendering them, `Layout.Screen` starts its content below the header, and
 * the screen's scroll view scrolls under it.
 *
 * Always false inside a dialog, which has nothing to do with the screen's
 * header even when it's rendered inside the screen.
 */
export function useNativeHeader() {
  const nativeHeader = useContext(NativeHeaderContext)
  const {isWithinDialog} = useDialogContext()
  return nativeHeader && !isWithinDialog
}

/**
 * The native header's height, including the status bar, or 0 without one.
 */
export function useNativeHeaderHeight() {
  const nativeHeader = useNativeHeader()
  const height = useContext(HeaderHeightContext)
  return nativeHeader ? (height ?? 0) : 0
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
