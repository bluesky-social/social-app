import {createContext, useContext, useEffect} from 'react'
import {
  type DerivedValue,
  interpolateColor,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import {useContributionRegistry} from '#/lib/hooks/useContributionRegistry'
import {useScreenPresence} from '#/lib/hooks/useScreenPresence'
import {useTheme} from '#/alf'

type Register = (contribution: SharedValue<number>) => () => void

const HideBottomBarBorderContext = createContext<DerivedValue<number> | null>(
  null,
)
HideBottomBarBorderContext.displayName = 'HideBottomBarBorderContext'
const HideBottomBarBorderSetterContext = createContext<Register | null>(null)
HideBottomBarBorderSetterContext.displayName =
  'HideBottomBarBorderSetterContext'

function useHideBottomBarBorderSetter() {
  const register = useContext(HideBottomBarBorderSetterContext)
  if (!register) {
    throw new Error(
      'useHideBottomBarBorderSetter must be used within a HideBottomBarBorderProvider',
    )
  }
  return register
}

/**
 * Hides the bottom bar's top border while the surrounding screen is present,
 * fading it with the screen transition.
 */
export function useHideBottomBarBorderForScreen() {
  const register = useHideBottomBarBorderSetter()
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

  useEffect(() => register(contribution), [register, contribution])
}

/**
 * How hidden the bottom bar border is, 0 (visible) to 1 (hidden).
 */
export function useHideBottomBarBorder() {
  const value = useContext(HideBottomBarBorderContext)
  if (!value) {
    throw new Error(
      'useHideBottomBarBorder must be used within a HideBottomBarBorderProvider',
    )
  }
  return value
}

/**
 * Animated border color for the bottom bar, blending the border into the
 * background as screens that hide it come and go. `alsoHidden` is a further
 * 0..1 hidden amount to combine in, for shell UI that sits on the bar.
 */
export function useBottomBarBorderStyle(alsoHidden?: SharedValue<number>) {
  const t = useTheme()
  const hideBorder = useHideBottomBarBorder()
  const visibleColor = t.atoms.border_contrast_low.borderColor
  const hiddenColor = t.atoms.bg.backgroundColor
  return useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      Math.max(hideBorder.get(), alsoHidden?.get() ?? 0),
      [0, 1],
      [visibleColor, hiddenColor],
    ),
  }))
}

export function Provider({children}: {children: React.ReactNode}) {
  const {total, register} = useContributionRegistry()

  return (
    <HideBottomBarBorderSetterContext.Provider value={register}>
      <HideBottomBarBorderContext.Provider value={total}>
        {children}
      </HideBottomBarBorderContext.Provider>
    </HideBottomBarBorderSetterContext.Provider>
  )
}
