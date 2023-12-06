import React from 'react'

const StateContext = React.createContext<{
  showLoggedOut: boolean
  requestedAccountSwitchTo?: string // did of account to switch to
}>({
  showLoggedOut: false,
  requestedAccountSwitchTo: undefined,
})

const ControlsContext = React.createContext<{
  setShowLoggedOut: (show: boolean, did?: string) => void
}>({
  setShowLoggedOut: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [showLoggedOut, setShowLoggedOut] = React.useState(false)
  const [requestedAccountSwitchTo, setRequestedAccountSwitchTo] =
    React.useState<string>()

  const state = React.useMemo(
    () => ({showLoggedOut, requestedAccountSwitchTo}),
    [showLoggedOut, requestedAccountSwitchTo],
  )

  const controls = React.useMemo(
    () => ({
      /**
       * Sets the visibility of the logged-out state and optionally specifies the account to switch to.
       * @param show - Whether to show the logged-out state.
       * @param did - The account to switch to (optional).
       */
      setShowLoggedOut: (show: boolean, did?: string) => {
        setShowLoggedOut(show)
        setRequestedAccountSwitchTo(did)
      },
    }),
    [setShowLoggedOut, setRequestedAccountSwitchTo],
  )

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
