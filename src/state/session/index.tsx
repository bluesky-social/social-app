import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {type AtpSessionEvent, type BskyAgent} from '@atproto/api'

import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {AnalyticsContext, useAnalyticsBase, utils} from '#/analytics'
import {IS_WEB} from '#/env'
import {emitSessionDropped} from '../events'
import {
  agentToSessionAccount,
  type BskyAppAgent,
  createAgentAndCreateAccount,
  createAgentAndLogin,
  createAgentAndResume,
  sessionAccountToSession,
} from './agent'
import {type Action, getInitialState, reducer, type State} from './reducer'
export {isSignupQueued} from './util'
import {addSessionDebugLog} from './logging'
export type {SessionAccount} from '#/state/session/types'

import {clearPersistedQueryStorage} from '#/lib/persisted-query-storage'
import {
  type SessionApiContext,
  type SessionStateContext,
} from '#/state/session/types'
import {useOnboardingDispatch} from '#/state/shell/onboarding'
import {
  clearAgeAssuranceData,
  clearAgeAssuranceDataForDid,
} from '#/ageAssurance/data'

const StateContext = createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})
StateContext.displayName = 'SessionStateContext'

const AgentContext = createContext<BskyAgent | null>(null)
AgentContext.displayName = 'SessionAgentContext'

const ApiContext = createContext<SessionApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logoutCurrentAccount: () => {},
  logoutEveryAccount: () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
  partialRefreshSession: async () => {},
})
ApiContext.displayName = 'SessionApiContext'

class SessionStore {
  private state: State
  private listeners = new Set<() => void>()

  constructor() {
    // Careful: By the time this runs, `persisted` needs to already be filled.
    const initialState = getInitialState(persisted.get('session').accounts)
    addSessionDebugLog({type: 'reducer:init', state: initialState})
    this.state = initialState
  }

  getState = (): State => {
    return this.state
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  dispatch = (action: Action) => {
    const nextState = reducer(this.state, action)
    this.state = nextState
    // Persist synchronously without waiting for the React render cycle.
    if (nextState.needsPersist) {
      nextState.needsPersist = false
      const persistedData = {
        accounts: nextState.accounts,
        currentAccount: nextState.accounts.find(
          a => a.did === nextState.currentAgentState.did,
        ),
      }
      addSessionDebugLog({type: 'persisted:broadcast', data: persistedData})
      persisted.write('session', persistedData)
    }
    this.listeners.forEach(listener => listener())
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const ax = useAnalyticsBase()
  const cancelPendingTask = useOneTaskAtATime()
  const [store] = useState(() => new SessionStore())
  const state = useSyncExternalStore(store.subscribe, store.getState)
  const onboardingDispatch = useOnboardingDispatch()

  const onAgentSessionChange = useCallback(
    (agent: BskyAgent, accountDid: string, sessionEvent: AtpSessionEvent) => {
      const refreshedAccount = agentToSessionAccount(agent) // Mutable, so snapshot it right away.
      if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
        emitSessionDropped()
      }
      store.dispatch({
        type: 'received-agent-event',
        agent,
        refreshedAccount,
        accountDid,
        sessionEvent,
      })
    },
    [store],
  )

  const createAccount = useCallback<SessionApiContext['createAccount']>(
    async (params, metrics) => {
      addSessionDebugLog({type: 'method:start', method: 'createAccount'})
      const signal = cancelPendingTask()
      ax.metric('account:create:begin', {})
      const {agent, account} = await createAgentAndCreateAccount(
        params,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      ax.metric('account:create:success', metrics, {
        session: utils.accountToSessionMetadata(account),
      })
      addSessionDebugLog({type: 'method:end', method: 'createAccount', account})
    },
    [ax, store, onAgentSessionChange, cancelPendingTask],
  )

  const login = useCallback<SessionApiContext['login']>(
    async (params, logContext) => {
      addSessionDebugLog({type: 'method:start', method: 'login'})
      const signal = cancelPendingTask()
      const {agent, account} = await createAgentAndLogin(
        params,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      ax.metric(
        'account:loggedIn',
        {logContext, withPassword: true},
        {session: utils.accountToSessionMetadata(account)},
      )
      addSessionDebugLog({type: 'method:end', method: 'login', account})
    },
    [ax, store, onAgentSessionChange, cancelPendingTask],
  )

  const logoutCurrentAccount = useCallback<
    SessionApiContext['logoutCurrentAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      cancelPendingTask()
      const prevState = store.getState()
      store.dispatch({
        type: 'logged-out-current-account',
      })
      ax.metric(
        'account:loggedOut',
        {logContext, scope: 'current'},
        {
          session: utils.accountToSessionMetadata(
            prevState.accounts.find(
              a => a.did === prevState.currentAgentState.did,
            ),
          ),
        },
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
      if (prevState.currentAgentState.did) {
        clearAgeAssuranceDataForDid({did: prevState.currentAgentState.did})
        void clearPersistedQueryStorage(prevState.currentAgentState.did)
      }
      // reset onboarding flow on logout
      onboardingDispatch({type: 'skip'})
    },
    [ax, store, cancelPendingTask, onboardingDispatch],
  )

  const logoutEveryAccount = useCallback<
    SessionApiContext['logoutEveryAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      cancelPendingTask()
      const prevState = store.getState()
      store.dispatch({
        type: 'logged-out-every-account',
      })
      ax.metric(
        'account:loggedOut',
        {logContext, scope: 'every'},
        {
          session: utils.accountToSessionMetadata(
            prevState.accounts.find(
              a => a.did === prevState.currentAgentState.did,
            ),
          ),
        },
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
      clearAgeAssuranceData()
      for (const account of prevState.accounts) {
        void clearPersistedQueryStorage(account.did)
      }
      // reset onboarding flow on logout
      onboardingDispatch({type: 'skip'})
    },
    [store, cancelPendingTask, onboardingDispatch, ax],
  )

  const resumeSession = useCallback<SessionApiContext['resumeSession']>(
    async (storedAccount, isSwitchingAccounts = false) => {
      addSessionDebugLog({
        type: 'method:start',
        method: 'resumeSession',
        account: storedAccount,
      })
      const signal = cancelPendingTask()
      const {agent, account} = await createAgentAndResume(
        storedAccount,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      addSessionDebugLog({type: 'method:end', method: 'resumeSession', account})
      if (isSwitchingAccounts) {
        // reset onboarding flow on switch account
        onboardingDispatch({type: 'skip'})
      }
    },
    [store, onAgentSessionChange, cancelPendingTask, onboardingDispatch],
  )

  const partialRefreshSession = useCallback<
    SessionApiContext['partialRefreshSession']
  >(async () => {
    const agent = state.currentAgentState.agent as BskyAppAgent
    const signal = cancelPendingTask()
    const {data} = await agent.com.atproto.server.getSession()
    if (signal.aborted) return
    store.dispatch({
      type: 'partial-refresh-session',
      accountDid: agent.session!.did,
      patch: {
        emailConfirmed: data.emailConfirmed,
        emailAuthFactor: data.emailAuthFactor,
      },
    })
  }, [store, state, cancelPendingTask])

  const removeAccount = useCallback<SessionApiContext['removeAccount']>(
    account => {
      addSessionDebugLog({
        type: 'method:start',
        method: 'removeAccount',
        account,
      })
      cancelPendingTask()
      store.dispatch({
        type: 'removed-account',
        accountDid: account.did,
      })
      addSessionDebugLog({type: 'method:end', method: 'removeAccount', account})
      clearAgeAssuranceDataForDid({did: account.did})
    },
    [store, cancelPendingTask],
  )
  useEffect(() => {
    return persisted.onUpdate('session', nextSession => {
      const synced = nextSession
      addSessionDebugLog({type: 'persisted:receive', data: synced})
      store.dispatch({
        type: 'synced-accounts',
        syncedAccounts: synced.accounts,
        syncedCurrentDid: synced.currentAccount?.did,
      })
      const syncedAccount = synced.accounts.find(
        a => a.did === synced.currentAccount?.did,
      )
      if (syncedAccount && syncedAccount.refreshJwt) {
        if (syncedAccount.did !== state.currentAgentState.did) {
          resumeSession(syncedAccount)
        } else {
          const agent = state.currentAgentState.agent as BskyAgent
          const prevSession = agent.session
          agent.sessionManager.session = sessionAccountToSession(syncedAccount)
          addSessionDebugLog({
            type: 'agent:patch',
            agent,
            prevSession,
            nextSession: agent.session,
          })
        }
      }
    })
  }, [store, state, resumeSession])

  const stateContext = useMemo(
    () => ({
      accounts: state.accounts,
      currentAccount: state.accounts.find(
        a => a.did === state.currentAgentState.did,
      ),
      hasSession: !!state.currentAgentState.did,
    }),
    [state],
  )

  const api = useMemo(
    () => ({
      createAccount,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
      partialRefreshSession,
    }),
    [
      createAccount,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
      partialRefreshSession,
    ],
  )

  // @ts-expect-error window type is not declared, debug only
  if (__DEV__ && IS_WEB) window.agent = state.currentAgentState.agent

  const agent = state.currentAgentState.agent as BskyAppAgent
  const currentAgentRef = useRef(agent)
  useEffect(() => {
    if (currentAgentRef.current !== agent) {
      // Read the previous value and immediately advance the pointer.
      const prevAgent = currentAgentRef.current
      currentAgentRef.current = agent
      addSessionDebugLog({type: 'agent:switch', prevAgent, nextAgent: agent})
      // We never reuse agents so let's fully neutralize the previous one.
      // This ensures it won't try to consume any refresh tokens.
      prevAgent.dispose()
    }
  }, [agent])

  return (
    <AgentContext.Provider value={agent}>
      <StateContext.Provider value={stateContext}>
        <ApiContext.Provider value={api}>
          <AnalyticsContext
            metadata={utils.useMeta({
              session: utils.accountToSessionMetadata(
                stateContext.currentAccount,
              ),
            })}>
            {children}
          </AnalyticsContext>
        </ApiContext.Provider>
      </StateContext.Provider>
    </AgentContext.Provider>
  )
}

function useOneTaskAtATime() {
  const abortController = useRef<AbortController | null>(null)
  const cancelPendingTask = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()
    return abortController.current.signal
  }, [])
  return cancelPendingTask
}

export function useSession() {
  return useContext(StateContext)
}

export function useSessionApi() {
  return useContext(ApiContext)
}

export function useRequireAuth() {
  const {hasSession} = useSession()
  const closeAll = useCloseAllActiveElements()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  return useCallback(
    (fn: () => unknown) => {
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

export function useAgent(): BskyAgent {
  const agent = useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return agent
}
