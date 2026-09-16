import {createContext, useContext, useEffect, useMemo} from 'react'
import {
  type DerivedValue,
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import {SHELL_SPRING_CONFIG} from '#/lib/custom-animations/springs'
import {useContributionRegistry} from '#/lib/hooks/useContributionRegistry'
import {useScreenPresence} from '#/lib/hooks/useScreenPresence'

type StateContext = {
  /**
   * How hidden the bottom bar is, 0 (fully visible) to 1 (fully hidden). The
   * sum of `scrollMode` and every active screen contribution, clamped.
   */
  footerMode: DerivedValue<number>
  /**
   * The scroll-linked part of `footerMode`, driven by `MainScrollProvider`.
   */
  scrollMode: SharedValue<number>
}
type SetContext = {
  register: (contribution: SharedValue<number>) => () => void
}

const stateContext = createContext<StateContext | null>(null)
stateContext.displayName = 'MinimalModeStateContext'
const setContext = createContext<SetContext | null>(null)
setContext.displayName = 'MinimalModeSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const scrollMode = useSharedValue(0)
  const {total: footerMode, register} = useContributionRegistry(scrollMode)

  const setters = useMemo(() => ({register}), [register])
  const value = useMemo(
    () => ({footerMode, scrollMode}),
    [footerMode, scrollMode],
  )
  return (
    <stateContext.Provider value={value}>
      <setContext.Provider value={setters}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useMinimalShellMode() {
  const context = useContext(stateContext)
  if (!context)
    throw new Error(
      'useMinimalShellMode must be used within a MinimalModeProvider',
    )
  return context
}

/**
 * The scroll-linked part of the bottom bar's hidden state, for scroll
 * providers to drive directly. Reset to 0 to reveal the bar.
 */
export function useMinimalShellScrollMode() {
  return useMinimalShellMode().scrollMode
}

export function useMinimalShellModeSetters() {
  const context = useContext(setContext)
  if (!context)
    throw new Error(
      'useMinimalShellModeSetters must be used within a MinimalModeProvider',
    )
  return context
}

/**
 * Hides the bottom bar for as long as the calling component is mounted and
 * `enabled`, independent of navigation. Prefer `Layout.Screen`'s
 * `minimalShell` prop for screens, which tracks the screen transition.
 */
export function useEnableMinimalShellMode({enabled} = {enabled: true}) {
  const {register} = useMinimalShellModeSetters()
  const contribution = useSharedValue(0)
  useEffect(() => {
    if (!enabled) return
    const unregister = register(contribution)
    contribution.set(withSpring(1, SHELL_SPRING_CONFIG))
    return unregister
  }, [enabled, register, contribution])
}

/**
 * Hides the bottom bar while the surrounding screen is present, following its
 * transition in and out frame by frame. Used by `Layout.Screen`.
 */
export function useEnableMinimalShellModeForScreen(
  {enabled} = {enabled: true},
) {
  const {register} = useMinimalShellModeSetters()
  const {presence} = useScreenPresence()
  const contribution = useSharedValue(0)

  useAnimatedReaction(
    () => presence.get(),
    (current, previous) => {
      if (current !== previous) {
        contribution.set(current)
      }
    },
  )

  useEffect(() => {
    if (!enabled) return
    return register(contribution)
  }, [enabled, register, contribution])
}
