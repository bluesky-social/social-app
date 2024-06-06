import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  colorMode: persisted.Schema['colorMode']
  darkTheme: persisted.Schema['darkTheme']
}
type SetContext = {
  setColorMode: (v: persisted.Schema['colorMode']) => void
  setDarkTheme: (v: persisted.Schema['darkTheme']) => void
}

const stateContext = createContext<StateContext>({
  colorMode: 'system',
  darkTheme: 'dark',
})
const setContext = createContext<SetContext>({} as SetContext)

export function Provider({children}: PropsWithChildren<{}>) {
  const [colorMode, setColorMode] = useState(persisted.get('colorMode'))
  const [darkTheme, setDarkTheme] = useState(persisted.get('darkTheme'))

  const stateContextValue = useMemo(
    () => ({
      colorMode,
      darkTheme,
    }),
    [colorMode, darkTheme],
  )

  const setContextValue = useMemo(
    () => ({
      setColorMode: (_colorMode: persisted.Schema['colorMode']) => {
        setColorMode(_colorMode)
        persisted.write('colorMode', _colorMode)
      },
      setDarkTheme: (_darkTheme: persisted.Schema['darkTheme']) => {
        setDarkTheme(_darkTheme)
        persisted.write('darkTheme', _darkTheme)
      },
    }),
    [],
  )

  useEffect(() => {
    return persisted.onUpdate(() => {
      setColorMode(persisted.get('colorMode'))
      setDarkTheme(persisted.get('darkTheme'))
    })
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
