import React from 'react'
import {type Theme, type ThemeName} from '@bsky.app/alf'

import {
  computeFontScaleMultiplier,
  getFontFamily,
  getFontScale,
  setFontFamily as persistFontFamily,
  setFontScale as persistFontScale,
} from '#/alf/fonts'
import {themes} from '#/alf/themes'
import {type Device} from '#/storage'

export {
  type TextStyleProp,
  type Theme,
  utils,
  type ViewStyleProp,
} from '@bsky.app/alf'
export {atoms} from '#/alf/atoms'
export * from '#/alf/breakpoints'
export * from '#/alf/fonts'
export * as tokens from '#/alf/tokens'
export * from '#/alf/util/flatten'
export * from '#/alf/util/platform'
export * from '#/alf/util/themeSelector'
export * from '#/alf/util/useGutters'

export type Alf = {
  themeName: ThemeName
  theme: Theme
  themes: typeof themes
  fonts: {
    scale: Exclude<Device['fontScale'], undefined>
    scaleMultiplier: number
    family: Device['fontFamily']
    setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void
    setFontFamily: (fontFamily: Device['fontFamily']) => void
  }
  /**
   * Feature flags or other gated options
   */
  flags: {}
}

/*
 * Context
 */
export const Context = React.createContext<Alf>({
  themeName: 'light',
  theme: themes.light,
  themes,
  fonts: {
    scale: getFontScale(),
    scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
    family: getFontFamily(),
    setFontScale: () => {},
    setFontFamily: () => {},
  },
  flags: {},
})
Context.displayName = 'AlfContext'

export function ThemeProvider({
  children,
  theme: themeName,
}: React.PropsWithChildren<{theme: ThemeName}>) {
  const [fontScale, setFontScale] = React.useState<Alf['fonts']['scale']>(() =>
    getFontScale(),
  )
  const [fontScaleMultiplier, setFontScaleMultiplier] = React.useState(() =>
    computeFontScaleMultiplier(fontScale),
  )
  const setFontScaleAndPersist = React.useCallback<
    Alf['fonts']['setFontScale']
  >(
    fs => {
      setFontScale(fs)
      persistFontScale(fs)
      setFontScaleMultiplier(computeFontScaleMultiplier(fs))
    },
    [setFontScale],
  )
  const [fontFamily, setFontFamily] = React.useState<Alf['fonts']['family']>(
    () => getFontFamily(),
  )
  const setFontFamilyAndPersist = React.useCallback<
    Alf['fonts']['setFontFamily']
  >(
    ff => {
      setFontFamily(ff)
      persistFontFamily(ff)
    },
    [setFontFamily],
  )

  const value = React.useMemo<Alf>(
    () => ({
      themes,
      themeName: themeName,
      theme: themes[themeName],
      fonts: {
        scale: fontScale,
        scaleMultiplier: fontScaleMultiplier,
        family: fontFamily,
        setFontScale: setFontScaleAndPersist,
        setFontFamily: setFontFamilyAndPersist,
      },
      flags: {},
    }),
    [
      themeName,
      fontScale,
      setFontScaleAndPersist,
      fontFamily,
      setFontFamilyAndPersist,
      fontScaleMultiplier,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
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
