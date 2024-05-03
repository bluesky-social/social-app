import React from 'react'
import {AtpSessionEvent, BskyAgent} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {logEvent, tryFetchGates} from '#/lib/statsig/statsig'
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
  SessionStateContext,
} from '#/state/session/types'

export {isSessionDeactivated}

const PUBLIC_BSKY_AGENT = new BskyAgent({service: PUBLIC_BSKY_SERVICE})
configureModerationForGuest()

const StateContext = React.createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const ApiContext = React.createContext<SessionApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  removeAccount: () => {},
  updateCurrentAccount: () => {},
  clearCurrentAccount: () => {},
})

let __globalAgent: BskyAgent = PUBLIC_BSKY_AGENT

function __getAgent() {
  return __globalAgent
}

type AgentState = {
  readonly agent: BskyAgent
  readonly did: string | undefined
}

type State = {
  accounts: SessionStateContext['accounts']
  currentAgentState: AgentState
  needsPersist: boolean
}

// This is supposed to not have side effects but it does for now.
function setupPublicAgentState() {
  // TODO: Actually create new agents.
  __globalAgent = PUBLIC_BSKY_AGENT // Side effect but will be removed.
  configureModerationForGuest() // Side effect but only relevant for tests
  return {
    agent: PUBLIC_BSKY_AGENT,
    did: undefined,
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<State>(() => ({
    accounts: persisted.get('session').accounts,
    currentAgentState: setupPublicAgentState(),
    needsPersist: false,
  }))

  const clearCurrentAccount = React.useCallback(() => {
    setState(s => ({
      accounts: s.accounts,
      currentAgentState: setupPublicAgentState(),
      needsPersist: true,
    }))
  }, [setState])

  const onAgentSessionChange = React.useCallback(
    (agent: BskyAgent, accountDid: string, event: AtpSessionEvent) => {
      const refreshedAccount = agentToSessionAccount(agent) // Mutable, so snapshot it right away.
      const expired = event === 'expired' || event === 'create-failed'
      if (expired) {
        emitSessionDropped()
      }

      if (event === 'network-error') {
        setState(s => ({
          accounts: s.accounts,
          currentAgentState: setupPublicAgentState(),
          needsPersist: true,
        }))
        return
      }

      if (expired) {
        setState(s => ({
          accounts: s.accounts,
          currentAgentState: setupPublicAgentState(),
          needsPersist: true,
        }))
      }

      setState(s => {
        const existingAccount = s.accounts.find(a => a.did === accountDid)
        if (
          !existingAccount ||
          JSON.stringify(existingAccount) === JSON.stringify(refreshedAccount)
        ) {
          // Fast path without a state update.
          return s
        }
        return {
          accounts: s.accounts.map(a => {
            if (a.did !== accountDid) {
              return a
            }
            if (refreshedAccount) {
              return refreshedAccount
            } else {
              return {
                ...a,
                // If we didn't receive a refreshed account, clear out the tokens.
                accessJwt: undefined,
                refreshJwt: undefined,
              }
            }
          }),
          currentAgentState: s.currentAgentState,
          needsPersist: true,
        }
      })
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

      agent.setPersistSessionHandler(event => {
        onAgentSessionChange(agent, account.did, event)
      })

      __globalAgent = agent
      await fetchingGates
      setState(s => {
        return {
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
          currentAgentState: {
            did: account.did,
            agent: agent,
          },
          needsPersist: true,
        }
      })

      track('Create Account')
      logEvent('account:create:success', {})
    },
    [onAgentSessionChange],
  )

  const login = React.useCallback<SessionApiContext['login']>(
    async ({service, identifier, password, authFactorToken}, logContext) => {
      const {agent, account, fetchingGates} = await createAgentAndLogin({
        service,
        identifier,
        password,
        authFactorToken,
      })

      agent.setPersistSessionHandler(event => {
        onAgentSessionChange(agent, account.did, event)
      })

      __globalAgent = agent
      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await fetchingGates
      setState(s => {
        return {
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
          currentAgentState: {
            did: account.did,
            agent: agent,
          },
          needsPersist: true,
        }
      })

      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [onAgentSessionChange],
  )

  const logout = React.useCallback<SessionApiContext['logout']>(
    async logContext => {
      setState(s => {
        return {
          accounts: s.accounts.map(a => ({
            ...a,
            refreshJwt: undefined,
            accessJwt: undefined,
          })),
          currentAgentState: setupPublicAgentState(),
          needsPersist: true,
        }
      })
      logEvent('account:loggedOut', {logContext})
    },
    [setState],
  )

  const initSession = React.useCallback<SessionApiContext['initSession']>(
    async account => {
      const fetchingGates = tryFetchGates(account.did, 'prefer-low-latency')

      const agent = new BskyAgent({service: account.service})

      // restore the correct PDS URL if available
      if (account.pdsUrl) {
        agent.pdsUrl = agent.api.xrpc.uri = new URL(account.pdsUrl)
      }

      agent.setPersistSessionHandler(event => {
        onAgentSessionChange(agent, account.did, event)
      })

      // @ts-ignore
      if (IS_DEV && isWeb) window.agent = agent
      await configureModerationForAccount(agent, account)

      const accountOrSessionDeactivated =
        isSessionDeactivated(account.accessJwt) || account.deactivated

      const prevSession = {
        accessJwt: account.accessJwt ?? '',
        refreshJwt: account.refreshJwt ?? '',
        did: account.did,
        handle: account.handle,
      }

      if (isSessionExpired(account)) {
        const freshAccount = await resumeSessionWithFreshAccount()
        __globalAgent = agent
        await fetchingGates
        setState(s => {
          return {
            accounts: [
              freshAccount,
              ...s.accounts.filter(a => a.did !== freshAccount.did),
            ],
            currentAgentState: {
              did: freshAccount.did,
              agent: agent,
            },
            needsPersist: true,
          }
        })
      } else {
        agent.session = prevSession
        __globalAgent = agent
        await fetchingGates
        setState(s => {
          return {
            accounts: [
              account,
              ...s.accounts.filter(a => a.did !== account.did),
            ],
            currentAgentState: {
              did: account.did,
              agent: agent,
            },
            needsPersist: true,
          }
        })

        if (accountOrSessionDeactivated) {
          // don't attempt to resume
          // use will be taken to the deactivated screen
          return
        }

        // Intentionally not awaited to unblock the UI:
        resumeSessionWithFreshAccount()
      }

      async function resumeSessionWithFreshAccount(): Promise<SessionAccount> {
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
    [onAgentSessionChange],
  )

  const removeAccount = React.useCallback<SessionApiContext['removeAccount']>(
    account => {
      setState(s => {
        return {
          accounts: s.accounts.filter(a => a.did !== account.did),
          currentAgentState: s.currentAgentState,
          needsPersist: true,
        }
      })
    },
    [setState],
  )

  const updateCurrentAccount = React.useCallback<
    SessionApiContext['updateCurrentAccount']
  >(
    account => {
      setState(s => {
        const currentAccount = s.accounts.find(
          a => a.did === s.currentAgentState.did,
        )
        // ignore, should never happen
        if (!currentAccount) return s

        const updatedAccount = {
          ...currentAccount,
          handle: account.handle ?? currentAccount.handle,
          email: account.email ?? currentAccount.email,
          emailConfirmed:
            account.emailConfirmed ?? currentAccount.emailConfirmed,
          emailAuthFactor:
            account.emailAuthFactor ?? currentAccount.emailAuthFactor,
        }

        return {
          accounts: [
            updatedAccount,
            ...s.accounts.filter(a => a.did !== currentAccount.did),
          ],
          currentAgentState: s.currentAgentState,
          needsPersist: true,
        }
      })
    },
    [setState],
  )

  React.useEffect(() => {
    if (state.needsPersist) {
      state.needsPersist = false
      persisted.write('session', {
        accounts: state.accounts,
        currentAccount: state.accounts.find(
          a => a.did === state.currentAgentState.did,
        ),
      })
    }
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      const persistedSession = persisted.get('session')

      setState(s => ({
        accounts: persistedSession.accounts,
        currentAgentState: s.currentAgentState,
        needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
      }))

      const selectedAccount = persistedSession.accounts.find(
        a => a.did === persistedSession.currentAccount?.did,
      )

      if (selectedAccount && selectedAccount.refreshJwt) {
        if (selectedAccount.did !== state.currentAgentState.did) {
          initSession(selectedAccount)
        } else {
          // @ts-ignore we checked for `refreshJwt` above
          __globalAgent.session = selectedAccount
          // TODO: This needs a setState.
        }
      } else if (!selectedAccount && state.currentAgentState.did) {
        setState(s => ({
          accounts: s.accounts,
          currentAgentState: setupPublicAgentState(),
          needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
        }))
      }
    })
  }, [state, setState, initSession])

  const stateContext = React.useMemo(
    () => ({
      accounts: state.accounts,
      currentAccount: state.accounts.find(
        a => a.did === state.currentAgentState.did,
      ),
      hasSession: !!state.currentAgentState.did,
    }),
    [state],
  )

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      initSession,
      removeAccount,
      updateCurrentAccount,
      clearCurrentAccount,
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      removeAccount,
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
