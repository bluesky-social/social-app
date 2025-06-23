import {createContext, useContext, useMemo, useState} from 'react'
import {type SharedValue, useSharedValue} from 'react-native-reanimated'
import {
  type EdgeInsets,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'

import {clamp} from '#/lib/numbers'
import {isWeb} from '#/platform/detection'
import {atoms as a, platform, useBreakpoints} from '#/alf'

type LayoutContextValue = {
  headerHeight: SharedValue<number>
  footerHeight: number
  setFooterHeight: (height: number) => void
}

const LayoutContext = createContext<LayoutContextValue>({
  headerHeight: {
    value: 0,
    addListener() {},
    removeListener() {},
    modify() {},
    get() {
      return 0
    },
    set() {},
  },
  footerHeight: 0,
  setFooterHeight: () => {},
})
LayoutContext.displayName = 'ShellLayoutContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerHeight = useSharedValue(0)
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const [footerHeight, setFooterHeight] = useState(() =>
    estimateInitialHeight(insets),
  )

  const value = useMemo(
    () => ({
      headerHeight,
      footerHeight: isWeb && gtMobile ? 0 : footerHeight,
      setFooterHeight: (height: number) => setFooterHeight(round4dp(height)),
    }),
    [headerHeight, footerHeight, setFooterHeight, gtMobile],
  )

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  )
}

export function useShellLayout() {
  return useContext(LayoutContext)
}

function estimateInitialHeight(insets: EdgeInsets): number {
  return platform({
    // try and precisely guess the footer height, then round it to 4 decimal places
    // to remove floating point imprecision. if we can guess it exactly,
    // we get to skip a rerender
    native: round4dp(47 + a.border.borderWidth + clamp(insets.bottom, 15, 60)),
    web: 58,
    default: 0,
  })
}

function round4dp(value: number) {
  return Math.round(value * 10000) / 10000
}
