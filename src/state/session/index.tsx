import React from 'react'
import {AtpSessionEvent, BskyAgent} from '@atproto/api'

import {track} from '#/lib/analytics/analytics'
import {networkRetry} from '#/lib/async/retry'
import {logEvent, tryFetchGates} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {IS_DEV} from '#/env'
import {emitSessionDropped} from '../events'
import {
  agentToSessionAccount,
  createAgentAndCreateAccount,
  createAgentAndLogin,
} from './agent'
import {configureModerationForAccount} from './moderation'
import {getInitialState, reducer} from './reducer'
import {isSessionExpired} from './util'

export {isSessionDeactivated} from './util'
export type {SessionAccount} from '#/state/session/types'
import {
  SessionAccount,
  SessionApiContext,
  SessionStateContext,
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
  logout: async () => {},
  initSession: async () => {},
  removeAccount: () => {},
  updateCurrentAccount: () => {},
})

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, dispatch] = React.useReducer(reducer, null, () =>
    getInitialState(persisted.get('session').accounts),
  )

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
      const {agent, account} = await createAgentAndCreateAccount(
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
        onAgentSessionChange,
      )
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
      const {agent, account} = await createAgentAndLogin(
        {
          service,
          identifier,
          password,
          authFactorToken,
        },
        onAgentSessionChange,
      )
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
        if (!account.deactivated) {
          // Intentionally not awaited to unblock the UI:
          resumeSessionWithFreshAccount()
          return
        }
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
