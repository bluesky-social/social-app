import React from 'react'

import {useSession} from '#/state/session'
import {useActiveStarterPack} from '#/state/shell/starter-pack'
import {IS_WEB} from '#/env'

type State = {
  showLoggedOut: boolean
  /**
   * Account did used to populate the login form when the logged out view is
   * shown.
   */
  requestedAccountSwitchTo?: string
}

type Controls = {
  /**
   * Show or hide the logged out view.
   */
  setShowLoggedOut: (show: boolean) => void
  /**
   * Shows the logged out view and drops the user into the login form using the
   * requested account.
   */
  requestSwitchToAccount: (props: {
    /**
     * The did of the account to populate the login form with.
     */
    requestedAccount?: (string & {}) | 'none' | 'new' | 'starterpack'
  }) => void
  /**
   * Clears the requested account so that next time the logged out view is
   * show, no account is pre-populated.
   */
  clearRequestedAccount: () => void
}

const StateContext = React.createContext<State>({
  showLoggedOut: false,
  requestedAccountSwitchTo: undefined,
})
StateContext.displayName = 'LoggedOutStateContext'

const ControlsContext = React.createContext<Controls>({
  setShowLoggedOut: () => {},
  requestSwitchToAccount: () => {},
  clearRequestedAccount: () => {},
})
ControlsContext.displayName = 'LoggedOutControlsContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeStarterPack = useActiveStarterPack()
  const {hasSession} = useSession()
  const shouldShowStarterPack = Boolean(activeStarterPack?.uri) && !hasSession
  const [state, setState] = React.useState<State>({
    showLoggedOut: shouldShowStarterPack,
    requestedAccountSwitchTo: shouldShowStarterPack
      ? IS_WEB
        ? 'starterpack'
        : 'new'
      : undefined,
  })

  const controls = React.useMemo<Controls>(
    () => ({
      setShowLoggedOut(show) {
        setState(s => ({
          ...s,
          showLoggedOut: show,
        }))
      },
      requestSwitchToAccount({requestedAccount}) {
        setState(s => ({
          ...s,
          showLoggedOut: true,
          requestedAccountSwitchTo: requestedAccount,
        }))
      },
      clearRequestedAccount() {
        setState(s => ({
          ...s,
          requestedAccountSwitchTo: undefined,
        }))
      },
    }),
    [setState],
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
