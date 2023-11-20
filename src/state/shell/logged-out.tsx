import React from 'react'

type StateContext = {
  showLoggedOut: boolean
}

const StateContext = React.createContext<StateContext>({
  showLoggedOut: false,
})
const ControlsContext = React.createContext<{
  setShowLoggedOut: (show: boolean) => void
}>({
  setShowLoggedOut: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [showLoggedOut, setShowLoggedOut] = React.useState(false)

  const state = React.useMemo(() => ({showLoggedOut}), [showLoggedOut])
  const controls = React.useMemo(() => ({setShowLoggedOut}), [setShowLoggedOut])

  return (
    <StateContext.Provider value={state}>
      <ControlsContext.Provider value={controls}>
        {children}
      </ControlsContext.Provider>
    </StateContext.Provider>
  )
}

export function useLoggedOutView() {
  return React.useContext(StateContext)
}

export function useLoggedOutViewControls() {
  return React.useContext(ControlsContext)
}
