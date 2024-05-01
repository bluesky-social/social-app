import React from 'react'
import {BskyAgent} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {logEvent} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {
  SessionAccount,
  SessionApiContext,
  SessionStateContext,
} from '#/state/session/types'
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
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [isSwitchingAccounts, setIsSwitchingAccounts] = React.useState(false)
  const [state, setState] = React.useState(() => ({
    accounts: persisted.get('session').accounts,
    currentAgent: INITIAL_AGENT,
    needsPersist: false,
  }))
  const currentAccountDid = React.useMemo(
    () => state.currentAgent.session?.did,
    [state.currentAgent],
  )

  const upsertAndPersistAccount = React.useCallback(
    (account: SessionAccount) => {
      setState(s => ({
        accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
        currentAgent: s.currentAgent,
        needsPersist: true,
      }))
    },
    [setState],
  )

  const clearCurrentAccount = React.useCallback(() => {
    logger.warn(`session: clear current account`)

    // immediate clear this so any pending requests don't use it
    state.currentAgent.setPersistSessionHandler(() => {})

    const newAgent = new BskyAgent({service: PUBLIC_BSKY_SERVICE})
    configureModerationForGuest()
    setState(s => ({
      accounts: s.accounts,
      currentAgent: newAgent,
      needsPersist: true,
    }))
  }, [state.currentAgent, setState])

  React.useEffect(() => {
    /*
     * This method is continually overwritten when `currentAgent` and dependent
     * methods local to this file change, so that the freshest agent and
     * handlers are always used.
     */
    state.currentAgent.setPersistSessionHandler(event => {
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
      const refreshedAccount = agentToSessionAccount(state.currentAgent)

      if (refreshedAccount) {
        /*
         * If the session expired naturally, or it was otherwise successfully
         * created/updated, we want to update/persist the data.
         */
        upsertAndPersistAccount(refreshedAccount)
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
  }, [state.currentAgent, clearCurrentAccount, upsertAndPersistAccount])

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

      const {agent, account, fetchingGates} = await createAgentAndCreateAccount(
        {
          service,
          email,
          password,
          handle,
          inviteCode,
          verificationPhone,
          verificationCode,
        },
      )

      await fetchingGates
      setState(s => ({
        accounts: s.accounts,
        currentAgent: agent,
        needsPersist: true,
      }))
      upsertAndPersistAccount(account)

      logger.debug(`session: created account`, {}, logger.DebugContext.session)
      track('Create Account')
      logEvent('account:create:success', {})
    },
    [upsertAndPersistAccount],
  )

  const login = React.useCallback<SessionApiContext['login']>(
    async ({service, identifier, password, authFactorToken}, logContext) => {
      logger.debug(`session: login`, {}, logger.DebugContext.session)

      const {agent, account, fetchingGates} = await createAgentAndLogin({
        service,
        identifier,
        password,
        authFactorToken,
      })

      await fetchingGates
      setState(s => ({
        accounts: s.accounts,
        currentAgent: agent,
        needsPersist: true,
      }))
      upsertAndPersistAccount(account)

      logger.debug(`session: logged in`, {}, logger.DebugContext.session)
      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [upsertAndPersistAccount],
  )

  const logout = React.useCallback<SessionApiContext['logout']>(
    async logContext => {
      logger.debug(`session: logout`)

      clearCurrentAccount()
      setState(s => ({
        accounts: s.accounts.map(a => ({
          ...a,
          accessJwt: undefined,
          refreshJwt: undefined,
        })),
        currentAgent: s.currentAgent,
        needsPersist: true,
      }))

      logEvent('account:loggedOut', {logContext})
    },
    [clearCurrentAccount, setState],
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
        setState(s => ({
          accounts: s.accounts,
          currentAgent: newAgent,
          needsPersist: true,
        }))
        upsertAndPersistAccount(agentToSessionAccount(newAgent)!)
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
        setState(s => ({
          accounts: s.accounts,
          currentAgent: newAgent,
          needsPersist: true,
        }))
        upsertAndPersistAccount(account)
      }
    },
    [upsertAndPersistAccount],
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
      setState(s => ({
        accounts: s.accounts.filter(a => a.did !== account.did),
        currentAgent: s.currentAgent,
        needsPersist: true,
      }))
    },
    [setState],
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
    const newAgent = state.currentAgent.clone()
    await newAgent.resumeSession(sessionAccountToAgentSession(selectedAccount)!)
    const refreshedAccount = agentToSessionAccount(newAgent)
    await configureModerationForAccount(newAgent, refreshedAccount!)

    upsertAndPersistAccount(refreshedAccount!)
    setState(s => ({
      accounts: s.accounts,
      currentAgent: newAgent,
      needsPersist: true,
    }))
  }, [currentAccountDid, state.currentAgent, setState, upsertAndPersistAccount])

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
      persisted.write('session', {
        accounts: state.accounts,
        currentAccount: state.accounts.find(a => a.did === currentAccountDid),
      })
    }
  }, [state, currentAccountDid])

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
      setState(s => ({
        accounts: persistedSession.accounts,
        currentAgent: s.currentAgent,
        needsPersist: false,
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
          const newAgent = state.currentAgent.clone()
          newAgent.session = sessionAccountToAgentSession(selectedAccount)
          await configureModerationForAccount(newAgent, selectedAccount)
          setState(s => ({
            accounts: s.accounts,
            currentAgent: newAgent,
            needsPersist: false,
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
  }, [
    currentAccountDid,
    state.currentAgent,
    setState,
    initSession,
    clearCurrentAccount,
  ])

  const stateContext = React.useMemo(
    () => ({
      isInitialLoad,
      isSwitchingAccounts,
      currentAccount: state.accounts.find(a => a.did === currentAccountDid),
      accounts: state.accounts,
      currentAgent: state.currentAgent,
      hasSession: Boolean(currentAccountDid),
    }),
    [
      isInitialLoad,
      isSwitchingAccounts,
      state.accounts,
      state.currentAgent,
      currentAccountDid,
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
