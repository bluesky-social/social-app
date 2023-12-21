import React from 'react'
import {Dimensions} from 'react-native'
import * as themes from '#/alf/themes'

export * as tokens from '#/alf/tokens'
export {styles} from '#/alf/styles'
export * from '#/alf/util/platform'

type BreakpointName = keyof typeof breakpoints

/*
 * Breakpoints
 */
const breakpoints: {
  [key: string]: number
} = {
  gtMobile: 800,
  gtTablet: 1200,
}
function getActiveBreakpoints({width}: {width: number}) {
  const active: (keyof typeof breakpoints)[] = Object.keys(breakpoints).filter(
    breakpoint => width >= breakpoints[breakpoint],
  )

  return {
    active,
    current: active[active.length - 1],
  }
}

/*
 * Context
 */
export const Context = React.createContext<{
  themeName: themes.ThemeName
  styles: themes.Theme
  breakpoints: {
    current: BreakpointName | undefined
    active: BreakpointName[]
  }
}>({
  themeName: 'light',
  styles: themes.light,
  breakpoints: {
    current: undefined,
    active: [],
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
      if (bp.current !== breakpoints.current) setBreakpoints(bp)
    })

    return listener.remove
  }, [breakpoints, setBreakpoints])

  return (
    <Context.Provider
      value={React.useMemo(
        () => ({
          themeName: themeName,
          styles: theme,
          breakpoints,
        }),
        [theme, themeName, breakpoints],
      )}>
      {children}
    </Context.Provider>
  )
}

export function useAlf() {
  return React.useContext(Context)
}

export function useBreakpoints() {
  return React.useContext(Context).breakpoints
}
