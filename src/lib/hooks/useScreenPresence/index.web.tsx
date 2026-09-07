import {useCallback} from 'react'
import {
  Reanimated3DefaultSpringConfig,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'

import {ScreenPresenceContext} from './context'

export {type ScreenPresence, useScreenPresence} from './context'

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

  useFocusEffect(
    useCallback(() => {
      const spring = (to: number) =>
        withSpring(to, {
          ...Reanimated3DefaultSpringConfig,
          overshootClamping: true,
        })
      presence.set(spring(1))
      return () => presence.set(spring(0))
    }, [presence]),
  )

  return (
    <ScreenPresenceContext.Provider value={{visibility, presence}}>
      {children}
    </ScreenPresenceContext.Provider>
  )
}
