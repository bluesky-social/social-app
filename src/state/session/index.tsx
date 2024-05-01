import React from 'react'
import {BskyAgent} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {SessionApiContext, SessionStateContext} from '#/state/session/types'
import {
  agentToSessionAccount,
  configureModerationForAccount,
  configureModerationForGuest,
  createAgentAndCreateAccount,
  createAgentAndLogin,
  isSessionDeactivated,
  isSessionExpired,
  sessionAccountToAgentSession,
} from '#/state/session/util'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import * as Toast from '#/view/com/util/Toast'
import {IS_DEV} from '#/env'
import {emitSessionDropped} from '../events'

export type {CurrentAccount, SessionAccount} from '#/state/session/types'
export {isSessionDeactivated}

/**
 * Only used for the initial agent values in state and context. Replaced
 * immediately, and should not be reused.
 */
const INITIAL_AGENT = new BskyAgent({service: PUBLIC_BSKY_SERVICE})
configureModerationForGuest()

const StateContext = React.createContext<SessionStateContext>({
  currentAgent: INITIAL_AGENT,
  isInitialLoad: true,
  isSwitchingAccounts: false,
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const ApiContext = React.createContext<SessionApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
  selectAccount: async () => {},
  refreshSession: () => {},
  clearCurrentAccount: () => {},
  updateCurrentAccount: async () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(() => ({
    accounts: persisted.get('session').accounts,
    currentAgent: INITIAL_AGENT,
    needsPersist: false,
  }))
  const {accounts, currentAgent} = state
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [isSwitchingAccounts, setIsSwitchingAccounts] = React.useState(false)
  const currentAccountDid = React.useMemo(
    () => currentAgent.session?.did,
    [currentAgent],
  )
  const currentAccount = React.useMemo(
    () => accounts.find(a => a.did === currentAccountDid),
    [accounts, currentAccountDid],
  )

  const switchAccountAndPersist = React.useCallback((newAgent: BskyAgent) => {
    const account = agentToSessionAccount(newAgent)
    setState(prev => {
      let nextAccounts = prev.accounts
      if (account) {
        nextAccounts = [
          account,
          ...prev.accounts.filter(a => a.did !== account.did),
        ]
      }
      return {
        accounts: nextAccounts,
        currentAgent: newAgent,
        needsPersist: true,
      }
    })
  }, [])

  const clearCurrentAccount = React.useCallback(() => {
    logger.warn(`session: clear current account`)

    // immediate clear this so any pending requests don't use it
    currentAgent.setPersistSessionHandler(() => {})

    const newAgent = new BskyAgent({service: PUBLIC_BSKY_SERVICE})
    configureModerationForGuest()
    switchAccountAndPersist(newAgent)
  }, [currentAgent, switchAccountAndPersist])

  React.useEffect(() => {
    /*
     * This method is continually overwritten when `currentAgent` and dependent
     * methods local to this file change, so that the freshest agent and
     * handlers are always used.
     */
    currentAgent.setPersistSessionHandler(event => {
      logger.debug(
        `session: persistSession`,
        {event},
        logger.DebugContext.session,
      )

      const expired = event === 'expired' || event === 'create-failed'

      /*
       * Special case for a network error that occurs when calling
       * `resumeSession`, which happens on page load, when switching
       * accounts, or when refreshing user session data.
       *
       * When this occurs, we drop the user back out to the login screen, but
       * we don't clear tokens, allowing them to quickly log back in when their
       * connection improves.
       */
      if (event === 'network-error') {
        logger.warn(
          `session: persistSessionHandler received network-error event`,
        )
        emitSessionDropped()
        clearCurrentAccount()
        setTimeout(() => {
          Toast.show(`Your internet connection is unstable. Please try again.`)
        }, 100)
        return
      }

      /*
       * If the session was expired naturally, we want to drop the user back
       * out to log in.
       */
      if (expired) {
        logger.warn(`session: expired`)
        emitSessionDropped()
        clearCurrentAccount()
        setTimeout(() => {
          Toast.show(`Sorry! We need you to enter your password.`)
        }, 100)
      }

      /**
       * The updated account object, derived from the updated session we just
       * received from this callback.
       */
      if (currentAgent.session) {
        /*
         * If the session expired naturally, or it was otherwise successfully
         * created/updated, we want to update/persist the data.
         */
        switchAccountAndPersist(currentAgent)
      } else {
        /*
         * This should never happen based on current `AtpAgent` handling, but
         * it's here for TypeScript, and should result in the same handling as
         * a session expiration.
         */
        logger.error(`session: persistSession failed to get refreshed account`)
        emitSessionDropped()
        clearCurrentAccount()
        setTimeout(() => {
          Toast.show(`Sorry! We need you to enter your password.`)
        }, 100)
      }
    })
  }, [currentAgent, clearCurrentAccount, switchAccountAndPersist])

  const createAccount = React.useCallback<SessionApiContext['createAccount']>(
    async ({
      service,
      email,
      password,
      handle,
      inviteCode,
      verificationPhone,
      verificationCode,
    }) => {
      logger.info(`session: creating account`)
      track('Try Create Account')
      logEvent('account:create:begin', {})

      const {agent, fetchingGates} = await createAgentAndCreateAccount({
        service,
        email,
        password,
        handle,
        inviteCode,
        verificationPhone,
        verificationCode,
      })

      await fetchingGates
      switchAccountAndPersist(agent)

      logger.debug(`session: created account`, {}, logger.DebugContext.session)
      track('Create Account')
      logEvent('account:create:success', {})
    },
    [switchAccountAndPersist],
  )

  const login = React.useCallback<SessionApiContext['login']>(
    async ({service, identifier, password, authFactorToken}, logContext) => {
      logger.debug(`session: login`, {}, logger.DebugContext.session)

      const {agent, fetchingGates} = await createAgentAndLogin({
        service,
        identifier,
        password,
        authFactorToken,
      })

      await fetchingGates
      switchAccountAndPersist(agent)

      logger.debug(`session: logged in`, {}, logger.DebugContext.session)
      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [switchAccountAndPersist],
  )

  const logout = React.useCallback<SessionApiContext['logout']>(
    async logContext => {
      logger.debug(`session: logout`)

      clearCurrentAccount()
      setState(prev => ({
        accounts: prev.accounts.map(a => ({
          ...a,
          accessJwt: undefined,
          refreshJwt: undefined,
        })),
        currentAgent: prev.currentAgent,
        needsPersist: true,
      }))

      logEvent('account:loggedOut', {logContext})
    },
    [clearCurrentAccount],
  )

  const initSession = React.useCallback<SessionApiContext['initSession']>(
    async account => {
      logger.debug(`session: initSession`, {}, logger.DebugContext.session)

      const newAgent = new BskyAgent({
        service: account.service,
      })

      // restore the correct PDS URL if available
      if (account.pdsUrl) {
        newAgent.pdsUrl = newAgent.api.xrpc.uri = new URL(account.pdsUrl)
      }

      const prevSession = {
        ...account,
        accessJwt: account.accessJwt || '',
        refreshJwt: account.refreshJwt || '',
      }

      /**
       * Optimistically update moderation services so that when the new agent
       * is applied, they're ready.
       *
       * If session resumption fails, this will be reset by
       * `clearCurrentAccount`.
       */
      await configureModerationForAccount(newAgent, account)

      if (isSessionExpired(account)) {
        /*
         * If session is expired, attempt to refresh the session using the
         * refresh token via `resumeSession`
         */
        logger.debug(
          `session: attempting to resumeSession using previous session`,
          {},
          logger.DebugContext.session,
        )
        await networkRetry(1, () => newAgent.resumeSession(prevSession))
        switchAccountAndPersist(newAgent)
      } else {
        /*
         * If the session is not expired, assume we can reuse it.
         */
        logger.debug(
          `session: attempting to reuse previous session`,
          {},
          logger.DebugContext.session,
        )
        newAgent.session = prevSession
        switchAccountAndPersist(newAgent)
      }
    },
    [switchAccountAndPersist],
  )

  const resumeSession = React.useCallback<SessionApiContext['resumeSession']>(
    async account => {
      try {
        if (account) {
          await initSession(account)
        }
      } catch (e) {
        logger.error(`session: resumeSession failed`, {message: e})
      } finally {
        setIsInitialLoad(false)
      }
    },
    [initSession, setIsInitialLoad],
  )

  const removeAccount = React.useCallback<SessionApiContext['removeAccount']>(
    account => {
      setState(prev => ({
        accounts: prev.accounts.filter(a => a.did !== account.did),
        currentAgent: prev.currentAgent,
        needsPersist: true,
      }))
    },
    [],
  )

  const refreshSession = React.useCallback<
    SessionApiContext['refreshSession']
  >(async () => {
    const {accounts: persistedAccounts} = persisted.get('session')
    const selectedAccount = persistedAccounts.find(
      a => a.did === currentAccountDid,
    )
    if (!selectedAccount) return

    // update and swap agent to trigger render refresh
    const newAgent = currentAgent.clone()
    await newAgent.resumeSession(sessionAccountToAgentSession(selectedAccount)!)
    const refreshedAccount = agentToSessionAccount(newAgent)
    await configureModerationForAccount(newAgent, refreshedAccount!)
    switchAccountAndPersist(newAgent)
  }, [currentAccountDid, currentAgent, switchAccountAndPersist])

  const updateCurrentAccount = React.useCallback(async () => {
    await refreshSession()
  }, [refreshSession])

  const selectAccount = React.useCallback<SessionApiContext['selectAccount']>(
    async (account, logContext) => {
      setIsSwitchingAccounts(true)
      try {
        await initSession(account)
        setIsSwitchingAccounts(false)
        logEvent('account:loggedIn', {logContext, withPassword: false})
      } catch (e) {
        // reset this in case of error
        setIsSwitchingAccounts(false)
        // but other listeners need a throw
        throw e
      }
    },
    [setIsSwitchingAccounts, initSession],
  )

  React.useEffect(() => {
    if (state.needsPersist) {
      state.needsPersist = false

      const currentAccountDid = state.currentAgent.session?.did
      const currentAccount = state.accounts.find(
        a => a.did === currentAccountDid,
      )
      persisted.write('session', {
        accounts: state.accounts,
        currentAccount: currentAccount,
      })
    }
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate(async () => {
      const persistedSession = persisted.get('session')

      logger.debug(
        `session: persisted onUpdate`,
        {},
        logger.DebugContext.session,
      )

      /*
       * Accounts are already persisted on other side of broadcast, but we need
       * to update them in memory in this tab.
       */
      setState(prev => ({
        accounts: persistedSession.accounts,
        currentAgent: prev.currentAgent,
        needsPersist: false, // We're syncing with another tab which already did that.
      }))

      const selectedAccount = persistedSession.accounts.find(
        a => a.did === persistedSession.currentAccount?.did,
      )

      if (selectedAccount && selectedAccount.refreshJwt) {
        if (selectedAccount?.did !== currentAccountDid) {
          logger.debug(
            `session: persisted onUpdate, switching accounts`,
            {
              from: {
                did: currentAccountDid,
              },
              to: {
                did: selectedAccount.did,
              },
            },
            logger.DebugContext.session,
          )

          await initSession(selectedAccount)
        } else {
          logger.debug(
            `session: persisted onUpdate, updating session`,
            {},
            logger.DebugContext.session,
          )
          /*
           * Create a new agent for the same account, with updated data from
           * other side of broadcast. Update on state to re-derive
           * `currentAccount` and re-render the app.
           */
          const newAgent = currentAgent.clone()
          newAgent.session = sessionAccountToAgentSession(selectedAccount)
          await configureModerationForAccount(newAgent, selectedAccount)
          setState(prev => ({
            accounts: prev.accounts,
            currentAgent: newAgent,
            needsPersist: false, // We're syncing with another tab which already did that.
          }))
        }
      } else if (!selectedAccount && currentAccountDid) {
        logger.debug(
          `session: persisted onUpdate, logging out`,
          {},
          logger.DebugContext.session,
        )

        /*
         * No need to do a hard logout here. If we reach this, tokens for this
         * account have already been cleared either by an `expired` event
         * handled by `persistSession` (which nukes this accounts tokens only),
         * or by a `logout` call  which nukes all accounts tokens)
         */
        clearCurrentAccount()
      }
    })
  }, [currentAccountDid, clearCurrentAccount, initSession, currentAgent])

  const stateContext = React.useMemo(
    () => ({
      currentAgent,
      isInitialLoad,
      isSwitchingAccounts,
      currentAccount,
      accounts,
      hasSession: Boolean(currentAccount),
    }),
    [
      currentAgent,
      isInitialLoad,
      isSwitchingAccounts,
      accounts,
      currentAccount,
    ],
  )

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      selectAccount,
      refreshSession,
      clearCurrentAccount,
      updateCurrentAccount,
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      selectAccount,
      refreshSession,
      clearCurrentAccount,
      updateCurrentAccount,
    ],
  )

  if (IS_DEV && isWeb) {
    // @ts-ignore
    window.agent = currentAgent
  }

  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useSession() {
  return React.useContext(StateContext)
}

export function useSessionApi() {
  return React.useContext(ApiContext)
}

export function useRequireAuth() {
  const {hasSession} = useSession()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const closeAll = useCloseAllActiveElements()

  return React.useCallback(
    (fn: () => void) => {
      if (hasSession) {
        fn()
      } else {
        closeAll()
        setShowLoggedOut(true)
      }
    },
    [hasSession, setShowLoggedOut, closeAll],
  )
}

export function useAgent() {
  const {currentAgent} = useSession()
  return React.useMemo(
    () => ({
      getAgent() {
        return currentAgent
      },
    }),
    [currentAgent],
  )
}
