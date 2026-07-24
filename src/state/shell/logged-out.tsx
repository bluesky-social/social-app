import {createContext, useContext, useMemo, useState} from 'react'

import {useSession} from '#/state/session'
import {useActiveLanding} from '#/state/shell/landing'
import {IS_WEB} from '#/env'

type State = {
  showLoggedOut: boolean
  /**
   * Account did used to populate the login form when the logged out view is
   * shown.
   */
  requestedAccountSwitchTo?: string
  /**
   * Incremented for every account-switch request so an already-mounted logged
   * out view can respond even when the requested account has not changed.
   */
  requestedAccountSwitchId: number
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
    requestedAccount?:
      | (string & {})
      | 'none'
      | 'new'
      | 'starterpack'
      | 'groupchat'
  }) => void
  /**
   * Clears the requested account so that next time the logged out view is
   * show, no account is pre-populated.
   */
  clearRequestedAccount: () => void
}

const StateContext = createContext<State>({
  showLoggedOut: false,
  requestedAccountSwitchTo: undefined,
  requestedAccountSwitchId: 0,
})
StateContext.displayName = 'LoggedOutStateContext'

const ControlsContext = createContext<Controls>({
  setShowLoggedOut: () => {},
  requestSwitchToAccount: () => {},
  clearRequestedAccount: () => {},
})
ControlsContext.displayName = 'LoggedOutControlsContext'

function getRequestedAccountFromLanding(
  landing: ReturnType<typeof useActiveLanding>,
  hasSession: boolean,
): string | undefined {
  if (hasSession || !landing) return undefined

  switch (landing.type) {
    case 'starterpack':
      return IS_WEB ? 'starterpack' : 'new'
    case 'groupchat':
      return 'groupchat'
    case 'verify-email':
      return 'none'
    default:
      return undefined
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeLanding = useActiveLanding()
  const {hasSession} = useSession()

  const requestedAccount = getRequestedAccountFromLanding(
    activeLanding,
    hasSession,
  )

  const [state, setState] = useState<State>({
    showLoggedOut: Boolean(requestedAccount),
    requestedAccountSwitchTo: requestedAccount,
    requestedAccountSwitchId: 0,
  })

  const controls = useMemo<Controls>(
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
          requestedAccountSwitchId: s.requestedAccountSwitchId + 1,
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
  return useContext(StateContext)
}

export function useLoggedOutViewControls() {
  return useContext(ControlsContext)
}
