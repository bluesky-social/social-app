import {useContext, useEffect} from 'react'
import {
  Reanimated3DefaultSpringConfig,
  type SharedValue,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {
  ReanimatedScreenProvider,
  useReanimatedTransitionProgress,
} from 'react-native-screens/reanimated'
import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native'

import {ScreenPresenceContext} from './context'

export {type ScreenPresence, useScreenPresence} from './context'

/**
 * Swaps react-native-screens' screen implementation for one that pipes the
 * native transition progress event into Reanimated shared values on the UI
 * thread. Must wrap the navigation tree.
 */
export function ScreenTransitionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ReanimatedScreenProvider>{children}</ReanimatedScreenProvider>
}

/**
 * Provides `useScreenPresence()` to a screen's subtree. Rendered by
 * `Layout.Screen`.
 */
export function ScreenPresenceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = useContext(NavigationContext)
  /*
   * The transition progress context only exists for routes rendered by a
   * native stack navigator, and the hook that reads it throws otherwise. Every
   * stack navigator in the app is a native stack, so the navigator type tells
   * us whether it is safe to read.
   */
  const isNativeStackRoute = navigation?.getState().type === 'stack'

  if (isNativeStackRoute) {
    return (
      <NativeStackScreenPresenceProvider navigation={navigation}>
        {children}
      </NativeStackScreenPresenceProvider>
    )
  }
  return <StaticScreenPresenceProvider>{children}</StaticScreenPresenceProvider>
}

function NativeStackScreenPresenceProvider({
  navigation,
  children,
}: {
  navigation: NavigationProp<ParamListBase>
  children: React.ReactNode
}) {
  /*
   * react-native-screens types these with `Animated.SharedValue`, a Reanimated
   * 3 alias that no longer exists in Reanimated 4, so the values come through
   * untyped.
   */
  const {progress, closing} = useReanimatedTransitionProgress() as {
    progress: SharedValue<number>
    closing: SharedValue<number>
  }
  const ancestorsFocused = useAncestorsFocused(navigation)

  const visibility = useDerivedValue(() => {
    const value = progress.get()
    return closing.get() ? 1 - value : value
  })
  const presence = useDerivedValue(() =>
    Math.min(visibility.get(), ancestorsFocused.get()),
  )

  return (
    <ScreenPresenceContext.Provider value={{visibility, presence}}>
      {children}
    </ScreenPresenceContext.Provider>
  )
}

function StaticScreenPresenceProvider({children}: {children: React.ReactNode}) {
  const one = useSharedValue(1)
  return (
    <ScreenPresenceContext.Provider value={{visibility: one, presence: one}}>
      {children}
    </ScreenPresenceContext.Provider>
  )
}

/**
 * Whether every navigator above this screen has it in focus, as a 0/1 shared
 * value that springs between the two. Stack transitions are covered by the
 * transition progress, so this only needs to react to changes that do not
 * animate a native stack, i.e. switching tabs.
 */
function useAncestorsFocused(navigation: NavigationProp<ParamListBase>) {
  const focused = useSharedValue(areAncestorsFocused(navigation) ? 1 : 0)

  useEffect(() => {
    const ancestors = getAncestors(navigation)
    if (ancestors.length === 0) return
    const update = () => {
      focused.set(
        withSpring(areAncestorsFocused(navigation) ? 1 : 0, {
          ...Reanimated3DefaultSpringConfig,
          overshootClamping: true,
        }),
      )
    }
    update()
    const unsubscribes = ancestors.flatMap(ancestor => [
      ancestor.addListener('focus', update),
      ancestor.addListener('blur', update),
    ])
    return () => unsubscribes.forEach(unsubscribe => unsubscribe())
  }, [navigation, focused])

  return focused
}

function getAncestors(navigation: NavigationProp<ParamListBase>) {
  const ancestors: NavigationProp<ParamListBase>[] = []
  let parent = navigation.getParent()
  while (parent) {
    ancestors.push(parent)
    parent = parent.getParent()
  }
  return ancestors
}

function areAncestorsFocused(navigation: NavigationProp<ParamListBase>) {
  // isFocused() already walks up the tree, so the nearest ancestor is enough
  const parent = navigation.getParent()
  return parent ? parent.isFocused() : true
}
