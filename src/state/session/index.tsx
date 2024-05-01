import React from 'react'
import {AtpPersistSessionHandler, BskyAgent} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {logEvent, tryFetchGates} from '#/lib/statsig/statsig'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {IS_DEV} from '#/env'
import {emitSessionDropped} from '../events'
import {
  agentToSessionAccount,
  configureModerationForAccount,
  configureModerationForGuest,
  createAgentAndCreateAccount,
  createAgentAndLogin,
  isSessionDeactivated,
  isSessionExpired,
} from './util'

export type {SessionAccount} from '#/state/session/types'
import {
  SessionAccount,
  SessionApiContext,
  SessionState,
  SessionStateContext,
} from '#/state/session/types'

export {isSessionDeactivated}

const PUBLIC_BSKY_AGENT = new BskyAgent({service: PUBLIC_BSKY_SERVICE})
configureModerationForGuest()

const StateContext = React.createContext<SessionStateContext>({
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
  updateCurrentAccount: () => {},
  clearCurrentAccount: () => {},
})

let __globalAgent: BskyAgent = PUBLIC_BSKY_AGENT

function __getAgent() {
  return __globalAgent
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const isDirty = React.useRef(false)
  const [state, setState] = React.useState<SessionState>({
    isInitialLoad: true,
    isSwitchingAccounts: false,
    accounts: persisted.get('session').accounts,
    currentAccount: undefined, // assume logged out to start
  })

  const setStateAndPersist = React.useCallback(
    (fn: (prev: SessionState) => SessionState) => {
      isDirty.current = true
      setState(fn)
    },
    [setState],
  )

  const upsertAccount = React.useCallback(
    (account: SessionAccount, expired = false) => {
      setStateAndPersist(s => {
        return {
          ...s,
          currentAccount: expired ? undefined : account,
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
        }
      })
    },
    [setStateAndPersist],
  )

  const clearCurrentAccount = React.useCallback(() => {
    logger.warn(`session: clear current account`)
    __globalAgent = PUBLIC_BSKY_AGENT
    configureModerationForGuest()
    setStateAndPersist(s => ({
      ...s,
      currentAccount: undefined,
    }))
  }, [setStateAndPersist])

  const createPersistSessionHandler = React.useCallback(
    (
      agent: BskyAgent,
      account: SessionAccount,
      persistSessionCallback: (props: {
        expired: boolean
        refreshedAccount: SessionAccount
      }) => void,
      {
        networkErrorCallback,
      }: {
        networkErrorCallback?: () => void
      } = {},
    ): AtpPersistSessionHandler => {
      return function persistSession(event, session) {
        const expired = event === 'expired' || event === 'create-failed'

        if (event === 'network-error') {
          logger.warn(
            `session: persistSessionHandler received network-error event`,
          )
          networkErrorCallback?.()
          return
        }

        // TODO: use agentToSessionAccount for this too.
        const refreshedAccount: SessionAccount = {
          service: account.service,
          did: session?.did || account.did,
          handle: session?.handle || account.handle,
          email: session?.email || account.email,
          emailConfirmed: session?.emailConfirmed || account.emailConfirmed,
          emailAuthFactor: session?.emailAuthFactor || account.emailAuthFactor,
          deactivated: isSessionDeactivated(session?.accessJwt),
          pdsUrl: agent.pdsUrl?.toString(),

          /*
           * Tokens are undefined if the session expires, or if creation fails for
           * any reason e.g. tokens are invalid, network error, etc.
           */
          refreshJwt: session?.refreshJwt,
          accessJwt: session?.accessJwt,
        }

        logger.debug(`session: persistSession`, {
          event,
          deactivated: refreshedAccount.deactivated,
        })

        if (expired) {
          logger.warn(`session: expired`)
          emitSessionDropped()
        }

        /*
         * If the session expired, or it was successfully created/updated, we want
         * to update/persist the data.
         *
         * If the session creation failed, it could be a network error, or it could
         * be more serious like an invalid token(s). We can't differentiate, so in
         * order to allow the user to get a fresh token (if they need it), we need
         * to persist this data and wipe their tokens, effectively logging them
         * out.
         */
        persistSessionCallback({
          expired,
          refreshedAccount,
        })
      }
    },
    [],
  )

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

      agent.setPersistSessionHandler(
        createPersistSessionHandler(
          agent,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      __globalAgent = agent
      await fetchingGates
      upsertAccount(account)

      logger.debug(`session: created account`, {}, logger.DebugContext.session)
      track('Create Account')
      logEvent('account:create:success', {})
    },
    [upsertAccount, clearCurrentAccount, createPersistSessionHandler],
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

      agent.setPersistSessionHandler(
        createPersistSessionHandler(
          agent,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      __globalAgent = agent
      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await fetchingGates
      upsertAccount(account)

      logger.debug(`session: logged in`, {}, logger.DebugContext.session)

      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [upsertAccount, clearCurrentAccount, createPersistSessionHandler],
  )

  const logout = React.useCallback<SessionApiContext['logout']>(
    async logContext => {
      logger.debug(`session: logout`)
      clearCurrentAccount()
      setStateAndPersist(s => {
        return {
          ...s,
          accounts: s.accounts.map(a => ({
            ...a,
            refreshJwt: undefined,
            accessJwt: undefined,
          })),
        }
      })
      logEvent('account:loggedOut', {logContext})
    },
    [clearCurrentAccount, setStateAndPersist],
  )

  const initSession = React.useCallback<SessionApiContext['initSession']>(
    async account => {
      logger.debug(`session: initSession`, {}, logger.DebugContext.session)
      const fetchingGates = tryFetchGates(account.did, 'prefer-low-latency')

      const agent = new BskyAgent({service: account.service})

      // restore the correct PDS URL if available
      if (account.pdsUrl) {
        agent.pdsUrl = agent.api.xrpc.uri = new URL(account.pdsUrl)
      }

      agent.setPersistSessionHandler(
        createPersistSessionHandler(
          agent,
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
          {networkErrorCallback: clearCurrentAccount},
        ),
      )

      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await configureModerationForAccount(agent, account)

      const accountOrSessionDeactivated =
        isSessionDeactivated(account.accessJwt) || account.deactivated

      const prevSession = {
        accessJwt: account.accessJwt || '',
        refreshJwt: account.refreshJwt || '',
        did: account.did,
        handle: account.handle,
      }

      if (isSessionExpired(account)) {
        logger.debug(`session: attempting to resume using previous session`)

        try {
          const freshAccount = await resumeSessionWithFreshAccount()
          __globalAgent = agent
          await fetchingGates
          upsertAccount(freshAccount)
        } catch (e) {
          /*
           * Note: `agent.persistSession` is also called when this fails, and
           * we handle that failure via `createPersistSessionHandler`
           */
          logger.info(`session: resumeSessionWithFreshAccount failed`, {
            message: e,
          })

          __globalAgent = PUBLIC_BSKY_AGENT
        }
      } else {
        logger.debug(`session: attempting to reuse previous session`)

        agent.session = prevSession

        __globalAgent = agent
        await fetchingGates
        upsertAccount(account)

        if (accountOrSessionDeactivated) {
          // don't attempt to resume
          // use will be taken to the deactivated screen
          logger.debug(`session: reusing session for deactivated account`)
          return
        }

        // Intentionally not awaited to unblock the UI:
        resumeSessionWithFreshAccount()
          .then(freshAccount => {
            if (JSON.stringify(account) !== JSON.stringify(freshAccount)) {
              logger.info(
                `session: reuse of previous session returned a fresh account, upserting`,
              )
              upsertAccount(freshAccount)
            }
          })
          .catch(e => {
            /*
             * Note: `agent.persistSession` is also called when this fails, and
             * we handle that failure via `createPersistSessionHandler`
             */
            logger.info(`session: resumeSessionWithFreshAccount failed`, {
              message: e,
            })

            __globalAgent = PUBLIC_BSKY_AGENT
          })
      }

      async function resumeSessionWithFreshAccount(): Promise<SessionAccount> {
        logger.debug(`session: resumeSessionWithFreshAccount`)

        await networkRetry(1, () => agent.resumeSession(prevSession))
        const sessionAccount = agentToSessionAccount(agent)
        /*
         * If `agent.resumeSession` fails above, it'll throw. This is just to
         * make TypeScript happy.
         */
        if (!sessionAccount) {
          throw new Error(`session: initSession failed to establish a session`)
        }
        return sessionAccount
      }
    },
    [upsertAccount, clearCurrentAccount, createPersistSessionHandler],
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
        setState(s => ({
          ...s,
          isInitialLoad: false,
        }))
      }
    },
    [initSession],
  )

  const removeAccount = React.useCallback<SessionApiContext['removeAccount']>(
    account => {
      setStateAndPersist(s => {
        return {
          ...s,
          accounts: s.accounts.filter(a => a.did !== account.did),
        }
      })
    },
    [setStateAndPersist],
  )

  const updateCurrentAccount = React.useCallback<
    SessionApiContext['updateCurrentAccount']
  >(
    account => {
      setStateAndPersist(s => {
        const currentAccount = s.currentAccount

        // ignore, should never happen
        if (!currentAccount) return s

        const updatedAccount = {
          ...currentAccount,
          handle: account.handle || currentAccount.handle,
          email: account.email || currentAccount.email,
          emailConfirmed:
            account.emailConfirmed !== undefined
              ? account.emailConfirmed
              : currentAccount.emailConfirmed,
          emailAuthFactor:
            account.emailAuthFactor !== undefined
              ? account.emailAuthFactor
              : currentAccount.emailAuthFactor,
        }

        return {
          ...s,
          currentAccount: updatedAccount,
          accounts: [
            updatedAccount,
            ...s.accounts.filter(a => a.did !== currentAccount.did),
          ],
        }
      })
    },
    [setStateAndPersist],
  )

  const selectAccount = React.useCallback<SessionApiContext['selectAccount']>(
    async (account, logContext) => {
      setState(s => ({...s, isSwitchingAccounts: true}))
      try {
        await initSession(account)
        setState(s => ({...s, isSwitchingAccounts: false}))
        logEvent('account:loggedIn', {logContext, withPassword: false})
      } catch (e) {
        // reset this in case of error
        setState(s => ({...s, isSwitchingAccounts: false}))
        // but other listeners need a throw
        throw e
      }
    },
    [setState, initSession],
  )

  React.useEffect(() => {
    if (isDirty.current) {
      isDirty.current = false
      persisted.write('session', {
        accounts: state.accounts,
        currentAccount: state.currentAccount,
      })
    }
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      const session = persisted.get('session')

      logger.debug(`session: persisted onUpdate`, {})

      const selectedAccount = session.accounts.find(
        a => a.did === session.currentAccount?.did,
      )

      if (selectedAccount && selectedAccount.refreshJwt) {
        if (selectedAccount.did !== state.currentAccount?.did) {
          logger.debug(`session: persisted onUpdate, switching accounts`, {
            from: {
              did: state.currentAccount?.did,
              handle: state.currentAccount?.handle,
            },
            to: {
              did: selectedAccount.did,
              handle: selectedAccount.handle,
            },
          })

          initSession(selectedAccount)
        } else {
          logger.debug(`session: persisted onUpdate, updating session`, {})

          /*
           * Use updated session in this tab's agent. Do not call
           * upsertAccount, since that will only persist the session that's
           * already persisted, and we'll get a loop between tabs.
           */
          // @ts-ignore we checked for `refreshJwt` above
          __globalAgent.session = selectedAccount
        }
      } else if (!selectedAccount && state.currentAccount) {
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

      setState(s => ({
        ...s,
        accounts: session.accounts,
        currentAccount: selectedAccount,
      }))
    })
  }, [state, setState, clearCurrentAccount, initSession])

  const stateContext = React.useMemo(
    () => ({
      ...state,
      hasSession: !!state.currentAccount,
    }),
    [state],
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
      updateCurrentAccount,
      clearCurrentAccount,
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      selectAccount,
      updateCurrentAccount,
      clearCurrentAccount,
    ],
  )

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
  const closeAll = useCloseAllActiveElements()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  return React.useCallback(
    (fn: () => void) => {
      if (hasSession) {
        fn()
      } else {
        closeAll()
        signinDialogControl.open()
      }
    },
    [hasSession, signinDialogControl, closeAll],
  )
}

export function useAgent() {
  return React.useMemo(() => ({getAgent: __getAgent}), [])
}
