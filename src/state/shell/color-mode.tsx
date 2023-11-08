import React from 'react'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['colorMode']
type SetContext = (v: persisted.Schema['colorMode']) => void

const stateContext = React.createContext<StateContext>('system')
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['colorMode']) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('colorMode'))

  const setStateWrapped = React.useCallback(
    (colorMode: persisted.Schema['colorMode']) => {
      setState(colorMode)
      persisted.write('colorMode', colorMode)
      updateDocument(colorMode)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      setState(persisted.get('colorMode'))
      updateDocument(persisted.get('colorMode'))
    })
  }, [setState])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useColorMode() {
  return React.useContext(stateContext)
}

export function useSetColorMode() {
  return React.useContext(setContext)
}

function updateDocument(colorMode: string) {
  if (isWeb && typeof window !== 'undefined') {
    const html = window.document.documentElement
    // remove any other color mode classes
    html.className = html.className.replace(/colorMode--\w+/g, '')
    html.classList.add(`colorMode--${colorMode}`)
  }
}
