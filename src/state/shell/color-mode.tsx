import {createContext, useContext, useEffect, useMemo, useState} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  colorMode: persisted.Schema['colorMode']
  darkTheme: persisted.Schema['darkTheme']
  accentColor: persisted.Schema['accentColor'] // Eurosky
}
type SetContext = {
  setColorMode: (v: persisted.Schema['colorMode']) => void
  setDarkTheme: (v: persisted.Schema['darkTheme']) => void
  setAccentColor: (v: persisted.Schema['accentColor']) => void // Eurosky
}

const stateContext = createContext<StateContext>({
  colorMode: 'system',
  darkTheme: 'dark',
  accentColor: undefined,
})
stateContext.displayName = 'ColorModeStateContext'
const setContext = createContext<SetContext>({} as SetContext)
setContext.displayName = 'ColorModeSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [colorMode, setColorMode] = useState(() => persisted.get('colorMode'))
  const [darkTheme, setDarkTheme] = useState(() => persisted.get('darkTheme'))
  // Eurosky: per-user accent family
  const [accentColor, setAccentColor] = useState(() =>
    persisted.get('accentColor'),
  )

  const stateContextValue = useMemo(
    () => ({
      colorMode,
      darkTheme,
      accentColor,
    }),
    [colorMode, darkTheme, accentColor],
  )

  const setContextValue = useMemo(
    () => ({
      setColorMode: (_colorMode: persisted.Schema['colorMode']) => {
        setColorMode(_colorMode)
        void persisted.write('colorMode', _colorMode)
      },
      setDarkTheme: (_darkTheme: persisted.Schema['darkTheme']) => {
        setDarkTheme(_darkTheme)
        void persisted.write('darkTheme', _darkTheme)
      },
      // Eurosky: per-user accent family
      setAccentColor: (_accentColor: persisted.Schema['accentColor']) => {
        setAccentColor(_accentColor)
        void persisted.write('accentColor', _accentColor)
      },
    }),
    [],
  )

  useEffect(() => {
    const unsub1 = persisted.onUpdate('darkTheme', nextDarkTheme => {
      setDarkTheme(nextDarkTheme)
    })
    const unsub2 = persisted.onUpdate('colorMode', nextColorMode => {
      setColorMode(nextColorMode)
    })
    // Eurosky: per-user accent family
    const unsub3 = persisted.onUpdate('accentColor', nextAccentColor => {
      setAccentColor(nextAccentColor)
    })
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  return (
    <stateContext.Provider value={stateContextValue}>
      <setContext.Provider value={setContextValue}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useThemePrefs() {
  return useContext(stateContext)
}

export function useSetThemePrefs() {
  return useContext(setContext)
}
