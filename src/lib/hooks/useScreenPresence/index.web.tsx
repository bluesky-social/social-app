import {useCallback} from 'react'
import {useSharedValue, withSpring} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

import {SHELL_SPRING_CONFIG} from '#/lib/custom-animations/springs'
import {ScreenPresenceContext, useRegisterScreenCoverage} from './context'

export {
  ScreenCoverageProvider,
  type ScreenPresence,
  useScreenCoverage,
  useScreenPresence,
} from './context'

/**
 * No-op on web: there are no native stack transitions to track.
 */
export function ScreenTransitionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

/**
 * On web, screens do not animate in or out, so presence is simply focus, with
 * a spring so that dependent shell UI still animates.
 */
export function ScreenPresenceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const visibility = useSharedValue(1)
  const presence = useSharedValue(0)
  useRegisterScreenCoverage(presence)

  useFocusEffect(
    useCallback(() => {
      presence.set(withSpring(1, SHELL_SPRING_CONFIG))
      return () => presence.set(withSpring(0, SHELL_SPRING_CONFIG))
    }, [presence]),
  )

  return (
    <ScreenPresenceContext.Provider value={{visibility, presence}}>
      {children}
    </ScreenPresenceContext.Provider>
  )
}
