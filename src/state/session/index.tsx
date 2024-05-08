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

const StateContext = React.createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const AgentContext = React.createContext<BskyAgent | null>(null)

const ApiContext = React.createContext<SessionApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  removeAccount: () => {},
  updateCurrentAccount: () => {},
})

type AgentState = {
  readonly agent: BskyAgent
  readonly did: string | undefined
}

type State = {
  accounts: SessionStateContext['accounts']
  currentAgentState: AgentState
  needsPersist: boolean
}

type Action =
  | {
      type: 'received-agent-event'
      agent: BskyAgent
      accountDid: string
      refreshedAccount: SessionAccount | undefined
      sessionEvent: AtpSessionEvent
    }
  | {
      type: 'switched-to-account'
      newAgent: BskyAgent
      newAccount: SessionAccount
    }
  | {
      type: 'updated-current-account'
      updatedFields: Partial<
        Pick<
          SessionAccount,
          'handle' | 'email' | 'emailConfirmed' | 'emailAuthFactor'
        >
      >
    }
  | {
      type: 'removed-account'
      accountDid: string
    }
  | {
      type: 'logged-out'
    }
  | {
      type: 'synced-accounts'
      syncedAccounts: SessionAccount[]
      syncedCurrentDid: string | undefined
    }

function createPublicAgentState() {
  configureModerationForGuest() // Side effect but only relevant for tests
  return {
    agent: new BskyAgent({service: PUBLIC_BSKY_SERVICE}),
    did: undefined,
  }
}

function getInitialState(): State {
  return {
    accounts: persisted.get('session').accounts,
    currentAgentState: createPublicAgentState(),
    needsPersist: false,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'received-agent-event': {
      const {agent, accountDid, refreshedAccount, sessionEvent} = action
      if (agent !== state.currentAgentState.agent) {
        // Only consider events from the active agent.
        return state
      }
      if (sessionEvent === 'network-error') {
        // Don't change stored accounts but kick to the choose account screen.
        return {
          accounts: state.accounts,
          currentAgentState: createPublicAgentState(),
          needsPersist: true,
        }
      }
      const existingAccount = state.accounts.find(a => a.did === accountDid)
      if (
        !existingAccount ||
        JSON.stringify(existingAccount) === JSON.stringify(refreshedAccount)
      ) {
        // Fast path without a state update.
        return state
      }
      return {
        accounts: state.accounts.map(a => {
          if (a.did === accountDid) {
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
          } else {
            return a
          }
        }),
        currentAgentState: refreshedAccount
          ? state.currentAgentState
          : createPublicAgentState(), // Log out if expired.
        needsPersist: true,
      }
    }
    case 'switched-to-account': {
      const {newAccount, newAgent} = action
      return {
        accounts: [
          newAccount,
          ...state.accounts.filter(a => a.did !== newAccount.did),
        ],
        currentAgentState: {
          did: newAccount.did,
          agent: newAgent,
        },
        needsPersist: true,
      }
    }
    case 'updated-current-account': {
      const {updatedFields} = action
      return {
        accounts: state.accounts.map(a => {
          if (a.did === state.currentAgentState.did) {
            return {
              ...a,
              ...updatedFields,
            }
          } else {
            return a
          }
        }),
        currentAgentState: state.currentAgentState,
        needsPersist: true,
      }
    }
    case 'removed-account': {
      const {accountDid} = action
      return {
        accounts: state.accounts.filter(a => a.did !== accountDid),
        currentAgentState:
          state.currentAgentState.did === accountDid
            ? createPublicAgentState() // Log out if removing the current one.
            : state.currentAgentState,
        needsPersist: true,
      }
    }
    case 'logged-out': {
      return {
        accounts: state.accounts.map(a => ({
          ...a,
          // Clear tokens for *every* account (this is a hard logout).
          refreshJwt: undefined,
          accessJwt: undefined,
        })),
        currentAgentState: createPublicAgentState(),
        needsPersist: true,
      }
    }
    case 'synced-accounts': {
      const {syncedAccounts, syncedCurrentDid} = action
      return {
        accounts: syncedAccounts,
        currentAgentState:
          syncedCurrentDid === state.currentAgentState.did
            ? state.currentAgentState
            : createPublicAgentState(), // Log out if different user.
        needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
      }
    }
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(reducer, null, getInitialState)

  const onAgentSessionChange = React.useCallback(
    (agent: BskyAgent, accountDid: string, sessionEvent: AtpSessionEvent) => {
      const refreshedAccount = agentToSessionAccount(agent) // Mutable, so snapshot it right away.
      if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
        emitSessionDropped()
      }
      dispatch({
        type: 'received-agent-event',
        agent,
        refreshedAccount,
        accountDid,
        sessionEvent,
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
      birthDate,
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
          birthDate,
          inviteCode,
          verificationPhone,
          verificationCode,
        },
      )
      agent.setPersistSessionHandler(event => {
        onAgentSessionChange(agent, account.did, event)
      })
      await fetchingGates
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
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
      await fetchingGates
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      track('Sign In', {resumedSession: false})
      logEvent('account:loggedIn', {logContext, withPassword: true})
    },
    [onAgentSessionChange],
  )

  const logout = React.useCallback<SessionApiContext['logout']>(
    async logContext => {
      dispatch({
        type: 'logged-out',
      })
      logEvent('account:loggedOut', {logContext})
    },
    [],
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
      await configureModerationForAccount(agent, account)

      const prevSession = {
        accessJwt: account.accessJwt ?? '',
        refreshJwt: account.refreshJwt ?? '',
        did: account.did,
        handle: account.handle,
      }

      if (isSessionExpired(account)) {
        const freshAccount = await resumeSessionWithFreshAccount()
        await fetchingGates
        dispatch({
          type: 'switched-to-account',
          newAgent: agent,
          newAccount: freshAccount,
        })
      } else {
        agent.session = prevSession
        await fetchingGates
        dispatch({
          type: 'switched-to-account',
          newAgent: agent,
          newAccount: account,
        })
        if (isSessionDeactivated(account.accessJwt) || account.deactivated) {
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
      dispatch({
        type: 'removed-account',
        accountDid: account.did,
      })
    },
    [],
  )

  const updateCurrentAccount = React.useCallback<
    SessionApiContext['updateCurrentAccount']
  >(account => {
    dispatch({
      type: 'updated-current-account',
      updatedFields: account,
    })
  }, [])

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
      const synced = persisted.get('session')
      dispatch({
        type: 'synced-accounts',
        syncedAccounts: synced.accounts,
        syncedCurrentDid: synced.currentAccount?.did,
      })
      const syncedAccount = synced.accounts.find(
        a => a.did === synced.currentAccount?.did,
      )
      if (syncedAccount && syncedAccount.refreshJwt) {
        if (syncedAccount.did !== state.currentAgentState.did) {
          initSession(syncedAccount)
        } else {
          // @ts-ignore we checked for `refreshJwt` above
          state.currentAgentState.agent.session = syncedAccount
        }
      }
    })
  }, [state, initSession])

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
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      removeAccount,
      updateCurrentAccount,
    ],
  )

  // @ts-ignore
  if (IS_DEV && isWeb) window.agent = state.currentAgentState.agent

  return (
    <AgentContext.Provider value={state.currentAgentState.agent}>
      <StateContext.Provider value={stateContext}>
        <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
      </StateContext.Provider>
    </AgentContext.Provider>
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

export function useAgent(): {getAgent: () => BskyAgent} {
  const agent = React.useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return React.useMemo(
    () => ({
      getAgent() {
        return agent
      },
    }),
    [agent],
  )
}
