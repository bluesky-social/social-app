import {createContext, useCallback, useContext, useState} from 'react'

import {useHotkeysContext} from '#/lib/hotkeys'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = createContext<StateContext>(false)
stateContext.displayName = 'DrawerOpenStateContext'
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DrawerOpenSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(false)
  const {disableScope, enableScope} = useHotkeysContext()

  const setDrawerOpen = useCallback(
    (open: boolean) => {
      if (open) {
        disableScope('global')
      } else {
        enableScope('global')
      }
      setState(open)
    },
    [disableScope, enableScope],
  )

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setDrawerOpen}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerOpen() {
  return useContext(stateContext)
}

export function useSetDrawerOpen() {
  return useContext(setContext)
}
