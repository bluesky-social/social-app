import React from 'react'
import {useMediaQuery} from 'react-responsive'

import {useGate} from '#/lib/statsig/statsig'
import {
  getFontFamily,
  getFontScale,
  setFontFamily as persistFontFamily,
  setFontScale as persistFontScale,
} from '#/alf/fonts'
import {createThemes, defaultTheme} from '#/alf/themes'
import {Theme, ThemeName} from '#/alf/types'
import {BLUE_HUE, GREEN_HUE, RED_HUE} from '#/alf/util/colorGeneration'
import {Device} from '#/storage'

export {atoms} from '#/alf/atoms'
export * from '#/alf/fonts'
export * as tokens from '#/alf/tokens'
export * from '#/alf/types'
export * from '#/alf/util/flatten'
export * from '#/alf/util/platform'
export * from '#/alf/util/themeSelector'

export type Alf = {
  themeName: ThemeName
  theme: Theme
  themes: ReturnType<typeof createThemes>
  fonts: {
    scale: Exclude<Device['fontScale'], undefined>
    family: Device['fontFamily']
    setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void
    setFontFamily: (fontFamily: Device['fontFamily']) => void
  }
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
  fonts: {
    scale: getFontScale(),
    family: getFontFamily(),
    setFontScale: () => {},
    setFontFamily: () => {},
  },
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
  const [fontScale, setFontScale] = React.useState<Alf['fonts']['scale']>(
    () => {
      if (!neue) return 1
      return getFontScale()
    },
  )
  const setFontScaleAndPersist = React.useCallback<
    Alf['fonts']['setFontScale']
  >(
    fontScale => {
      setFontScale(fontScale)
      persistFontScale(fontScale)
    },
    [setFontScale],
  )
  const [fontFamily, setFontFamily] = React.useState<Alf['fonts']['family']>(
    () => getFontFamily(),
  )
  const setFontFamilyAndPersist = React.useCallback<
    Alf['fonts']['setFontFamily']
  >(
    fontFamily => {
      setFontFamily(fontFamily)
      persistFontFamily(fontFamily)
    },
    [setFontFamily],
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
          fonts: {
            scale: fontScale,
            family: fontFamily,
            setFontScale: setFontScaleAndPersist,
            setFontFamily: setFontFamilyAndPersist,
          },
          flags: {
            neue,
          },
        }),
        [
          themeName,
          themes,
          neue,
          fontScale,
          setFontScaleAndPersist,
          fontFamily,
          setFontFamilyAndPersist,
        ],
      )}>
      {children}
    </Context.Provider>
  )
}

export function useAlf() {
  return React.useContext(Context)
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
