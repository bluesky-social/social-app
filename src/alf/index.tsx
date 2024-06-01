import React from 'react'
import {Dimensions} from 'react-native'

import * as themes from '#/alf/themes'

export {atoms} from '#/alf/atoms'
export * as tokens from '#/alf/tokens'
export * from '#/alf/types'
export * from '#/alf/util/flatten'
export * from '#/alf/util/platform'
export * from '#/alf/util/themeSelector'

type BreakpointName = keyof typeof breakpoints

/*
 * Breakpoints
 */
const breakpoints: {
  [key: string]: number
} = {
  gtPhone: 500,
  gtMobile: 800,
  gtTablet: 1300,
}
function getActiveBreakpoints({width}: {width: number}) {
  const active: (keyof typeof breakpoints)[] = Object.keys(breakpoints).filter(
    breakpoint => width >= breakpoints[breakpoint],
  )

  return {
    active: active[active.length - 1],
    gtPhone: active.includes('gtPhone'),
    gtMobile: active.includes('gtMobile'),
    gtTablet: active.includes('gtTablet'),
  }
}

/*
 * Context
 */
export const Context = React.createContext<{
  themeName: themes.ThemeName
  theme: themes.Theme
  breakpoints: {
    active: BreakpointName | undefined
    gtPhone: boolean
    gtMobile: boolean
    gtTablet: boolean
  }
}>({
  themeName: 'light',
  theme: themes.light,
  breakpoints: {
    active: undefined,
    gtPhone: false,
    gtMobile: false,
    gtTablet: false,
  },
})

export function ThemeProvider({
  children,
  theme: themeName,
}: React.PropsWithChildren<{theme: themes.ThemeName}>) {
  const theme = themes[themeName]
  const [breakpoints, setBreakpoints] = React.useState(() =>
    getActiveBreakpoints({width: Dimensions.get('window').width}),
  )

  React.useEffect(() => {
    const listener = Dimensions.addEventListener('change', ({window}) => {
      const bp = getActiveBreakpoints({width: window.width})
      if (bp.active !== breakpoints.active) setBreakpoints(bp)
    })

    return listener.remove
  }, [breakpoints, setBreakpoints])

  return (
    <Context.Provider
      value={React.useMemo(
        () => ({
          themeName: themeName,
          theme: theme,
          breakpoints,
        }),
        [theme, themeName, breakpoints],
      )}>
      {children}
    </Context.Provider>
  )
}

export function useTheme() {
  return React.useContext(Context).theme
}

export function useBreakpoints() {
  return React.useContext(Context).breakpoints
}
