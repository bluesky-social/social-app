import React from 'react'
import {
  AtpPersistSessionHandler,
  BSKY_LABELER_DID,
  BskyAgent,
} from '@atproto/api'
import {jwtDecode} from 'jwt-decode'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {IS_TEST_USER} from '#/lib/constants'
import {logEvent, LogEvents} from '#/lib/statsig/statsig'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {PUBLIC_BSKY_AGENT} from '#/state/queries'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import * as Toast from '#/view/com/util/Toast'
import {IS_DEV} from '#/env'
import {emitSessionDropped} from '../events'
import {readLabelers} from './agent-config'

/**
 * @deprecated use `agent` from `useSession` instead
 */
let __globalAgent: BskyAgent = PUBLIC_BSKY_AGENT

/**
 * NOTE
 * Never hold on to the object returned by this function.
 * Call `getAgent()` at the time of invocation to ensure
 * that you never have a stale agent.
 *
 * @deprecated use `agent` from `useSession` instead
 */
export function getAgent() {
  return __globalAgent
}

;(() => {
  window.__id = Math.floor(Math.random() * 100).toString(36)
  console.log(`\nID ${window.__id}\n\n`)
})()

export type SessionAccount = persisted.PersistedAccount

export type StateContext = {
  currentAgent: BskyAgent
  isInitialLoad: boolean
  isSwitchingAccounts: boolean
  hasSession: boolean
  accounts: SessionAccount[]
  /**
   * This value is derived from `BskyAgent.session` and should contain the full
   * account object persisted to storage, minus the access tokens.
   */
  currentAccount: Omit<SessionAccount, 'accessJwt' | 'refreshJwt'> | undefined
}

export type ApiContext = {
  createAccount: (props: {
    service: string
    email: string
    password: string
    handle: string
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  }) => Promise<void>
  login: (
    props: {
      service: string
      identifier: string
      password: string
    },
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  /**
   * A full logout. Clears the `currentAccount` from session, AND removes
   * access tokens from all accounts, so that returning as any user will
   * require a full login.
   */
  logout: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => Promise<void>
  /**
   * A partial logout. Clears the `currentAccount` from session, but DOES NOT
   * clear access tokens from accounts, allowing the user to return to their
   * other accounts without logging in.
   *
   * Used when adding a new account, deleting an account.
   */
  clearCurrentAccount: () => void
  initSession: (account: SessionAccount) => Promise<void>
  resumeSession: (account?: SessionAccount) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  selectAccount: (
    account: SessionAccount,
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  /**
   * Refreshes the BskyAgent's session and derive a fresh `currentAccount`
   */
  refreshSession: () => void
}

const StateContext = React.createContext<StateContext>({
  currentAgent: PUBLIC_BSKY_AGENT,
  isInitialLoad: true,
  isSwitchingAccounts: false,
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const ApiContext = React.createContext<ApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
  selectAccount: async () => {},
  refreshSession: () => {},
  clearCurrentAccount: () => {},
})

function agentToSessionAccount(agent: BskyAgent): SessionAccount | undefined {
  if (!agent.session) return undefined

  return {
    service: agent.service.toString(),
    did: agent.session.did,
    handle: agent.session.handle,
    email: agent.session.email,
    emailConfirmed: agent.session.emailConfirmed,
    deactivated: isSessionDeactivated(agent.session.accessJwt),
    refreshJwt: agent.session.refreshJwt,
    accessJwt: agent.session.accessJwt,
  }
}

function agentToCurrentAccount(
  agent: BskyAgent,
): StateContext['currentAccount'] {
  const sessionAccount = agentToSessionAccount(agent)
  delete sessionAccount?.accessJwt
  delete sessionAccount?.refreshJwt
  return sessionAccount
}

function sessionAccountToAgentSession(
  account: SessionAccount,
): BskyAgent['session'] {
  return {
    did: account.did,
    handle: account.handle,
    email: account.email,
    emailConfirmed: account.emailConfirmed,
    accessJwt: account.accessJwt || '',
    refreshJwt: account.refreshJwt || '',
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const isDirty = React.useRef(false)
  const [currentAgent, setCurrentAgent] =
    React.useState<BskyAgent>(PUBLIC_BSKY_AGENT)
  const [accounts, setAccounts] = React.useState<SessionAccount[]>(
    persisted.get('session').accounts,
  )
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [isSwitchingAccounts, setIsSwitchingAccounts] = React.useState(false)
  const currentAccount = React.useMemo(
    () => agentToCurrentAccount(currentAgent),
    [currentAgent],
  )

  const persistNextUpdate = React.useCallback(
    () => (isDirty.current = true),
    [],
  )

  const upsertAndPersistAccount = React.useCallback(
    (account: SessionAccount) => {
      persistNextUpdate()
      setAccounts(accounts => [
        account,
        ...accounts.filter(a => a.did !== account.did),
      ])
    },
    [setAccounts, persistNextUpdate],
  )

  const clearCurrentAccount = React.useCallback(() => {
    logger.warn(`session: clear current account`)
    persistNextUpdate()
    setCurrentAgent(PUBLIC_BSKY_AGENT)
    BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
  }, [persistNextUpdate, setCurrentAgent])

  const persistSession = React.useCallback<
    (localAgent: BskyAgent) => AtpPersistSessionHandler
  >(
    localAgent => {
      return event => {
        logger.debug(
          `session: persistSession`,
          {event},
          logger.DebugContext.session,
        )

        const expired = event === 'expired' || event === 'create-failed'

        if (event === 'network-error') {
          logger.warn(
            `session: persistSessionHandler received network-error event`,
          )
          emitSessionDropped()
          clearCurrentAccount()
          setTimeout(() => {
            Toast.show(
              `Your internet connection is unstable. Please try again.`,
            )
          }, 100)
          return
        }

        // TODO this will get stale with agent.clone()
        const refreshedAccount = agentToSessionAccount(localAgent)

        if (!refreshedAccount) {
          logger.error(
            `session: persistSession failed to get refreshed account`,
          )
          emitSessionDropped()
          clearCurrentAccount()
          setTimeout(() => {
            Toast.show(`Sorry! We need you to enter your password.`)
          }, 100)
          return
        }

        if (expired) {
          logger.warn(`session: expired`)
          emitSessionDropped()
          clearCurrentAccount()
          setTimeout(() => {
            Toast.show(`Sorry! We need you to enter your password.`)
          }, 100)
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
        upsertAndPersistAccount(refreshedAccount)
      }
    },
    [clearCurrentAccount, upsertAndPersistAccount],
  )

  const createAccount = React.useCallback<ApiContext['createAccount']>(
    async ({
      service,
      email,
      password,
      handle,
      inviteCode,
      verificationPhone,
      verificationCode,
    }: any) => {
      logger.info(`session: creating account`)
      track('Try Create Account')
      logEvent('account:create:begin', {})

      const agent = new BskyAgent({service})

      await agent.createAccount({
        handle,
        password,
        email,
        inviteCode,
        verificationPhone,
        verificationCode,
      })

      if (!agent.session) {
        throw new Error(`session: createAccount failed to establish a session`)
      }

      const deactivated = isSessionDeactivated(agent.session.accessJwt)
      if (!deactivated) {
        /*dont await*/ agent.upsertProfile(_existing => {
          return {
            displayName: '',

            // HACKFIX
            // creating a bunch of identical profile objects is breaking the relay
            // tossing this unspecced field onto it to reduce the size of the problem
            // -prf
            createdAt: new Date().toISOString(),
          }
        })
      }

      const account = agentToSessionAccount(agent)!

      await configureModeration(agent, account)

      agent.setPersistSessionHandler(persistSession(agent))

      setCurrentAgent(agent)
      upsertAndPersistAccount(account)

      logger.debug(`session: created account`, {}, logger.DebugContext.session)
      track('Create Account')
      logEvent('account:create:success', {})
    },
    [upsertAndPersistAccount, persistSession],
  )

  const login = React.useCallback<ApiContext['login']>(
    async ({service, identifier, password}, logContext) => {
      logger.debug(`session: login`, {}, logger.DebugContext.session)

      const agent = new BskyAgent({service})
      await agent.login({identifier, password})

      if (!agent.session) {
        throw new Error(`session: login failed to establish a session`)
      }

      const account = agentToSessionAccount(agent)!
      await configureModeration(agent, account)

      agent.setPersistSessionHandler(persistSession(agent))

      setCurrentAgent(agent)
      upsertAndPersistAccount(account)

      logger.debug(`session: logged in`, {}, logger.DebugContext.session)

      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [upsertAndPersistAccount, persistSession],
  )

  const logout = React.useCallback<ApiContext['logout']>(
    async logContext => {
      logger.debug(`session: logout`)

      clearCurrentAccount()
      persistNextUpdate()
      setAccounts(accounts =>
        accounts.map(a => ({
          ...a,
          accessJwt: undefined,
          refreshJwt: undefined,
        })),
      )

      logEvent('account:loggedOut', {logContext})
    },
    [clearCurrentAccount, persistNextUpdate, setAccounts],
  )

  const initSession = React.useCallback<ApiContext['initSession']>(
    async account => {
      logger.debug(`session: initSession`, {}, logger.DebugContext.session)

      const agent = new BskyAgent({
        service: account.service,
      })
      agent.setPersistSessionHandler(persistSession(agent))

      const prevSession = {
        ...account,
        accessJwt: account.accessJwt || '',
        refreshJwt: account.refreshJwt || '',
      }

      let canReusePrevSession = false
      try {
        if (account.accessJwt) {
          const decoded = jwtDecode(account.accessJwt)
          if (decoded.exp) {
            const didExpire = Date.now() >= decoded.exp * 1000
            if (!didExpire) {
              canReusePrevSession = true
            }
          }
        }
      } catch (e) {
        logger.error(`session: could not decode jwt`)
      }

      // optimistic, we'll update this if we can't reuse or resume the session
      await configureModeration(agent, account)

      if (canReusePrevSession) {
        logger.debug(
          `session: attempting to reuse previous session`,
          {},
          logger.DebugContext.session,
        )
        agent.session = prevSession
        setCurrentAgent(agent)
        upsertAndPersistAccount(account)
      } else {
        logger.debug(
          `session: attempting to resumeSession using previous session`,
          {},
          logger.DebugContext.session,
        )
        // will call `persistSession` on `BskyAgent` instance above if success
        await networkRetry(1, () => agent.resumeSession(prevSession))
        setCurrentAgent(agent)
      }
    },
    [upsertAndPersistAccount, persistSession],
  )

  const resumeSession = React.useCallback<ApiContext['resumeSession']>(
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

  const removeAccount = React.useCallback<ApiContext['removeAccount']>(
    account => {
      persistNextUpdate()
      setAccounts(accounts => accounts.filter(a => a.did !== account.did))
    },
    [setAccounts, persistNextUpdate],
  )

  const refreshSession = React.useCallback<
    ApiContext['refreshSession']
  >(async () => {
    const {accounts: persistedAccounts} = persisted.get('session')
    const selectedAccount = persistedAccounts.find(
      a => a.did === currentAccount?.did,
    )
    if (!selectedAccount) return
    await currentAgent.resumeSession(
      sessionAccountToAgentSession(selectedAccount)!,
    )
    persistNextUpdate()
    upsertAndPersistAccount(agentToSessionAccount(currentAgent)!)
    setCurrentAgent(currentAgent.clone())
  }, [
    currentAccount,
    currentAgent,
    setCurrentAgent,
    persistNextUpdate,
    upsertAndPersistAccount,
  ])

  const selectAccount = React.useCallback<ApiContext['selectAccount']>(
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
    if (isDirty.current) {
      isDirty.current = false
      persisted.write('session', {
        accounts,
        currentAccount: currentAccount
          ? {
              did: currentAccount.did,
            }
          : undefined,
      })
    }
  }, [accounts, currentAccount])

  React.useEffect(() => {
    return persisted.onUpdate(async () => {
      const persistedSession = persisted.get('session')

      logger.debug(
        `session: persisted onUpdate`,
        {},
        logger.DebugContext.session,
      )

      // already persisted on other side of broadcast
      setAccounts(persistedSession.accounts)

      const selectedAccount = persistedSession.accounts.find(
        a => a.did === persistedSession.currentAccount?.did,
      )

      if (selectedAccount && selectedAccount.refreshJwt) {
        if (selectedAccount?.did !== currentAccount?.did) {
          logger.debug(
            `session: persisted onUpdate, switching accounts`,
            {
              from: {
                did: currentAccount?.did,
                handle: currentAccount?.handle,
              },
              to: {
                did: selectedAccount.did,
                handle: selectedAccount.handle,
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
          // updates silently, all subsequent calls will use the new session
          currentAgent.session = sessionAccountToAgentSession(selectedAccount)
          // replace agent to re-derive currentAccount and trigger rerender with fresh data
          setCurrentAgent(currentAgent.clone())
        }
      } else if (!selectedAccount && currentAccount) {
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
    currentAccount,
    setAccounts,
    clearCurrentAccount,
    initSession,
    currentAgent,
    setCurrentAgent,
  ])

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
    ],
  )

  // as we migrate, continue to keep this updated
  __globalAgent = currentAgent

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

async function configureModeration(agent: BskyAgent, account: SessionAccount) {
  if (IS_TEST_USER(account.handle)) {
    const did = (
      await agent
        .resolveHandle({handle: 'mod-authority.test'})
        .catch(_ => undefined)
    )?.data.did
    if (did) {
      console.warn('USING TEST ENV MODERATION')
      BskyAgent.configure({appLabelers: [did]})
    }
  } else {
    BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
    const labelerDids = await readLabelers(account.did).catch(_ => {})
    if (labelerDids) {
      agent.configureLabelersHeader(
        labelerDids.filter(did => did !== BSKY_LABELER_DID),
      )
    }
  }
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

export function isSessionDeactivated(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') && sessData.scope === 'com.atproto.deactivated'
    )
  }
  return false
}

export function readLastActiveAccount() {
  const {currentAccount, accounts} = persisted.get('session')
  return accounts.find(a => a.did === currentAccount?.did)
}
