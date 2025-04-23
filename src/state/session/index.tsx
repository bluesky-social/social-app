import React from 'react'
import {type AtpSessionEvent, type BskyAgent} from '@atproto/api'

import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {emitSessionDropped} from '../events'
import {
  agentToSessionAccount,
  type BskyAppAgent,
  createAgentAndCreateAccount,
  createAgentAndLogin,
  createAgentAndResume,
  sessionAccountToSession,
} from './agent'
import {getInitialState, reducer} from './reducer'

export {isSignupQueued} from './util'
import {addSessionDebugLog} from './logging'
export type {SessionAccount} from '#/state/session/types'
import {logger} from '#/logger'
import {
  type SessionApiContext,
  type SessionStateContext,
} from '#/state/session/types'

const StateContext = React.createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})

const AgentContext = React.createContext<BskyAgent | null>(null)

const ApiContext = React.createContext<SessionApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logoutCurrentAccount: async () => {},
  logoutEveryAccount: async () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const cancelPendingTask = useOneTaskAtATime()
  const [state, dispatch] = React.useReducer(reducer, null, () => {
    const initialState = getInitialState(persisted.get('session').accounts)
    addSessionDebugLog({type: 'reducer:init', state: initialState})
    return initialState
  })

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
    async (params, metrics) => {
      addSessionDebugLog({type: 'method:start', method: 'createAccount'})
      const signal = cancelPendingTask()
      logger.metric('account:create:begin', {}, {statsig: true})
      const {agent, account} = await createAgentAndCreateAccount(
        params,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      logger.metric('account:create:success', metrics, {statsig: true})
      addSessionDebugLog({type: 'method:end', method: 'createAccount', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  const login = React.useCallback<SessionApiContext['login']>(
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
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      logger.metric(
        'account:loggedIn',
        {logContext, withPassword: true},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'login', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  const logoutCurrentAccount = React.useCallback<
    SessionApiContext['logoutEveryAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      cancelPendingTask()
      dispatch({
        type: 'logged-out-current-account',
      })
      logger.metric(
        'account:loggedOut',
        {logContext, scope: 'current'},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
    },
    [cancelPendingTask],
  )

  const logoutEveryAccount = React.useCallback<
    SessionApiContext['logoutEveryAccount']
  >(
    logContext => {
      addSessionDebugLog({type: 'method:start', method: 'logout'})
      cancelPendingTask()
      dispatch({
        type: 'logged-out-every-account',
      })
      logger.metric(
        'account:loggedOut',
        {logContext, scope: 'every'},
        {statsig: true},
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
    },
    [cancelPendingTask],
  )

  const resumeSession = React.useCallback<SessionApiContext['resumeSession']>(
    async storedAccount => {
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
      dispatch({
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: account,
      })
      addSessionDebugLog({type: 'method:end', method: 'resumeSession', account})
    },
    [onAgentSessionChange, cancelPendingTask],
  )

  const removeAccount = React.useCallback<SessionApiContext['removeAccount']>(
    account => {
      addSessionDebugLog({
        type: 'method:start',
        method: 'removeAccount',
        account,
      })
      cancelPendingTask()
      dispatch({
        type: 'removed-account',
        accountDid: account.did,
      })
      addSessionDebugLog({type: 'method:end', method: 'removeAccount', account})
    },
    [cancelPendingTask],
  )

  React.useEffect(() => {
    if (state.needsPersist) {
      state.needsPersist = false
      const persistedData = {
        accounts: state.accounts,
        currentAccount: state.accounts.find(
          a => a.did === state.currentAgentState.did,
        ),
      }
      addSessionDebugLog({type: 'persisted:broadcast', data: persistedData})
      persisted.write('session', persistedData)
    }
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate('session', nextSession => {
      const synced = nextSession
      addSessionDebugLog({type: 'persisted:receive', data: synced})
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
  }, [state, resumeSession])

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
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
    }),
    [
      createAccount,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
    ],
  )

  // @ts-expect-error window type is not declared, debug only
  if (__DEV__ && isWeb) window.agent = state.currentAgentState.agent

  const agent = state.currentAgentState.agent as BskyAppAgent
  const currentAgentRef = React.useRef(agent)
  React.useEffect(() => {
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
        <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
      </StateContext.Provider>
    </AgentContext.Provider>
  )
}

function useOneTaskAtATime() {
  const abortController = React.useRef<AbortController | null>(null)
  const cancelPendingTask = React.useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()
    return abortController.current.signal
  }, [])
  return cancelPendingTask
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

export function useAgent(): BskyAgent {
  const agent = React.useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return agent
}
