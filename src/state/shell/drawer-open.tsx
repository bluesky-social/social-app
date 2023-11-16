import React from 'react'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(false)
const setContext = React.createContext<SetContext>((_: boolean) => {})

/**
 * @deprecated DO NOT USE THIS unless you have no other choice.
 */
export let unstable__closeDrawer: () => boolean = () => {
  throw new Error(`DrawerContext is not initialized`)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(false)

  unstable__closeDrawer = () => {
    let wasOpen = false
    setState(v => {
      wasOpen = v
      return false
    })
    return wasOpen
  }

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

export function useIsDrawerOpen() {
  return React.useContext(stateContext)
}

export function useSetDrawerOpen() {
  return React.useContext(setContext)
}
