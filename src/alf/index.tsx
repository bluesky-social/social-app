import React from 'react'
import {useMediaQuery} from 'react-responsive'

import {useGate} from '#/lib/statsig/statsig'
import {createThemes, defaultTheme} from '#/alf/themes'
import {Theme, ThemeName} from '#/alf/types'
import {BLUE_HUE, GREEN_HUE, RED_HUE} from '#/alf/util/colorGeneration'
import * as fontScaling from '#/alf/util/fontScaling'

export {atoms} from '#/alf/atoms'
export * as tokens from '#/alf/tokens'
export * from '#/alf/types'
export * from '#/alf/util/flatten'
export * from '#/alf/util/platform'
export * from '#/alf/util/themeSelector'

export type Alf = {
  themeName: ThemeName
  theme: Theme
  themes: ReturnType<typeof createThemes>
  fontScale: number
  setFontScale: (fontScale: number) => void
  flags: {
    neue: boolean
  }
}

/*
 * Context
 */
export const Context = React.createContext<Alf>({
  themeName: 'light',
  theme: defaultTheme,
  themes: createThemes({
    hues: {
      primary: BLUE_HUE,
      negative: RED_HUE,
      positive: GREEN_HUE,
    },
  }),
  fontScale: fontScaling.get(),
  setFontScale: () => {},
  flags: {
    neue: false,
  },
})

export function ThemeProvider({
  children,
  theme: themeName,
}: React.PropsWithChildren<{theme: ThemeName}>) {
  const gate = useGate()
  const [neue] = React.useState(() => gate('typography_neue'))
  const [fontScale, setFontScale] = React.useState(() => fontScaling.get())
  const setFontScaleAndPersist = React.useCallback(
    (fontScale: number) => {
      setFontScale(fontScale)
      fontScaling.set(fontScale)
    },
    [setFontScale],
  )
  const themes = React.useMemo(() => {
    return createThemes({
      hues: {
        primary: BLUE_HUE,
        negative: RED_HUE,
        positive: GREEN_HUE,
      },
    })
  }, [])

  return (
    <Context.Provider
      value={React.useMemo<Alf>(
        () => ({
          themes,
          themeName: themeName,
          theme: themes[themeName],
          fontScale,
          setFontScale: setFontScaleAndPersist,
          flags: {
            neue,
          },
        }),
        [themeName, themes, fontScale, setFontScaleAndPersist, neue],
      )}>
      {children}
    </Context.Provider>
  )
}

export function useAlf() {
  return React.useContext(Context)
}

export function useFontScale() {
  const {fontScale, setFontScale} = useAlf()
  return {fontScale, setFontScale}
}

export function useTheme(theme?: ThemeName) {
  const alf = useAlf()
  return React.useMemo(() => {
    return theme ? alf.themes[theme] : alf.theme
  }, [theme, alf])
}

export function useBreakpoints() {
  const gtPhone = useMediaQuery({minWidth: 500})
  const gtMobile = useMediaQuery({minWidth: 800})
  const gtTablet = useMediaQuery({minWidth: 1300})
  return {
    gtPhone,
    gtMobile,
    gtTablet,
  }
}
