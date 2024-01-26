import React from 'react'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'

type StateContext = {
  colorMode: persisted.Schema['colorMode']
  darkTheme: persisted.Schema['darkTheme']
}
type SetContext = {
  setColorMode: (v: persisted.Schema['colorMode']) => void
  setDarkTheme: (v: persisted.Schema['darkTheme']) => void
}

const stateContext = React.createContext<StateContext>({
  colorMode: 'system',
  darkTheme: 'dark',
})
const setContext = React.createContext<SetContext>({} as SetContext)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [colorMode, setColorMode] = React.useState(persisted.get('colorMode'))
  const [darkTheme, setDarkTheme] = React.useState(persisted.get('darkTheme'))

  const setColorModeWrapped = React.useCallback(
    (_colorMode: persisted.Schema['colorMode']) => {
      setColorMode(_colorMode)
      persisted.write('colorMode', _colorMode)
      updateDocument(_colorMode, persisted.get('darkTheme'))
    },
    [setColorMode],
  )

  const setDarkThemeWrapped = React.useCallback(
    (_darkTheme: persisted.Schema['darkTheme']) => {
      setDarkTheme(_darkTheme)
      persisted.write('darkTheme', _darkTheme)
      updateDocument(persisted.get('colorMode'), _darkTheme)
    },
    [setDarkTheme],
  )

  React.useEffect(() => {
    updateDocument(persisted.get('colorMode')) // set on load
    return persisted.onUpdate(() => {
      setColorModeWrapped(persisted.get('colorMode'))
      setDarkThemeWrapped(persisted.get('darkTheme'))
      updateDocument(persisted.get('colorMode'), persisted.get('darkTheme'))
    })
  }, [setColorModeWrapped, setDarkThemeWrapped])

  return (
    <stateContext.Provider value={{colorMode, darkTheme}}>
      <setContext.Provider
        value={{
          setDarkTheme: setDarkThemeWrapped,
          setColorMode: setColorModeWrapped,
        }}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useThemePrefs() {
  return React.useContext(stateContext)
}

export function useSetThemePrefs() {
  return React.useContext(setContext)
}

function updateDocument(colorMode: string, theme?: string) {
  if (isWeb && typeof window !== 'undefined') {
    const html = window.document.documentElement
    // remove any other color mode classes
    html.className = html.className.replace(/(colorMode|theme)--\w+/g, '')

    html.classList.add(`colorMode--${colorMode}`)

    if (colorMode === 'dark') {
      html.classList.add(`theme--${theme}`)
    }
  }
}
