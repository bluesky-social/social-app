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
import {type AtpSessionEvent} from '@atproto/api'
import {type Client} from '@atproto/lex-client'
import {PasswordSession} from '@atproto/lex-password-session'

import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {AnalyticsContext, useAnalyticsBase, utils} from '#/analytics'
import {IS_WEB} from '#/env'
import {com} from '#/lexicons'
import {emitSessionDropped} from '../events'
import {getPublicLexClient} from './clients'
import {type Action, getInitialState, reducer, type State} from './reducer'
import {
  buildBundle,
  createSessionBundleAndCreateAccount,
  createSessionBundleAndLogin,
  createSessionBundleAndResume,
  disposeBundle,
  makeSessionHooks,
  type PublicSessionBundle,
  sessionAccountToSessionData,
  type SessionAgent,
  type SessionBundle,
  sessionDataToSessionAccount,
} from './session-core'
export {type SessionAgent} from './session-core'
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
  clearAgeAssuranceServerDataForAll,
  clearAgeAssuranceServerDataForDid,
} from '#/ageAssurance/data'

const StateContext = createContext<SessionStateContext>({
  accounts: [],
  currentAccount: undefined,
  hasSession: false,
})
StateContext.displayName = 'SessionStateContext'

const AgentContext = createContext<SessionAgent | null>(null)
AgentContext.displayName = 'SessionAgentContext'

/**
 * Holds the full {@link SessionBundle} (or the logged-out
 * {@link PublicSessionBundle}) for the active account. The three-client hooks
 * (`useLexClient`/`useAppviewClient`/`usePdsClient`) read from here, while
 * `useAgent()` continues to read the bridge agent from {@link AgentContext}
 * (which is just `bundle.agent`).
 */
const BundleContext = createContext<SessionBundle | PublicSessionBundle | null>(
  null,
)
BundleContext.displayName = 'SessionBundleContext'

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
      void persisted.write('session', persistedData)
    }
    this.listeners.forEach(listener => listener())
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const ax = useAnalyticsBase()
  const cancelPendingTask = useOneTaskAtATime()
  // eslint-disable-next-line react/hook-use-state
  const [store] = useState(() => new SessionStore())
  const state = useSyncExternalStore(store.subscribe, store.getState)
  const onboardingDispatch = useOnboardingDispatch()

  const onAgentSessionChange = useCallback(
    (
      agent: SessionAgent,
      accountDid: string,
      sessionEvent: AtpSessionEvent,
    ) => {
      // Snapshot the (mutable) live session data right away.
      const refreshedAccount = agent.session
        ? sessionDataToSessionAccount(agent.session, agent.session.service)
        : undefined
      if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
        emitSessionDropped()
      }
      /*
       * The reducer stores the whole bundle as `currentAgentState.agent` and
       * compares `action.agent` by identity to decide whether an expiry/error
       * belongs to the active account (background accounts must not be able to
       * log the current user out). The hook hands us the SessionAgent that
       * fired; map it back to the current bundle when it is the active one, and
       * otherwise pass the SessionAgent itself as a distinct, non-matching token
       * so the reducer's guard ignores clears for background accounts - matching
       * the pre-migration semantics exactly.
       */
      const stored = store.getState().currentAgentState
        .agent as unknown as SessionBundle
      const eventAgent = (stored.agent === agent
        ? stored
        : agent) as unknown as SessionBundle
      store.dispatch({
        type: 'received-agent-event',
        agent: eventAgent,
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
      const {bundle, account} = await createSessionBundleAndCreateAccount(
        params,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: bundle,
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
      const {bundle, account} = await createSessionBundleAndLogin(
        params,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: bundle,
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
        clearAgeAssuranceServerDataForDid({
          did: prevState.currentAgentState.did,
        })
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
      clearAgeAssuranceServerDataForAll()
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
      const {bundle, account} = await createSessionBundleAndResume(
        storedAccount,
        onAgentSessionChange,
      )

      if (signal.aborted) {
        return
      }
      store.dispatch({
        type: 'switched-to-account',
        newAgent: bundle,
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
    const bundle = state.currentAgentState.agent as unknown as SessionBundle
    const signal = cancelPendingTask()
    /*
     * Fetch through the account (PDS) client and dispatch the patch. We do NOT
     * mutate the session object anymore (PasswordSession's data is immutable to
     * us); the reducer patches only the `accounts` entry, and the email-state
     * hook reads from the account rather than `agent.session` (Task 7).
     * `client.call` returns the response body directly (no `{data}` wrapper).
     */
    const data = await bundle.accountClient.call(com.atproto.server.getSession)
    if (signal.aborted) return
    store.dispatch({
      type: 'partial-refresh-session',
      accountDid: bundle.agent.session!.did,
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
      clearAgeAssuranceServerDataForDid({did: account.did})
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
          /*
           * Web handling: if leader tab has switched to a diff account that is
           * stale, it will refresh the session before triggering the update to
           * follower tabs. Follower tabs will therefore receive the fresh
           * session. See APP-1960, or ask Eric.
           */
          void resumeSession(syncedAccount)
        } else {
          /*
           * Same account, new tokens synced from the leader tab. PasswordSession
           * is immutable (no in-place session patch like the old
           * `agent.sessionManager.session = ...`), so rebuild a fresh bundle
           * from the synced tokens WITHOUT a network call (the leader already
           * refreshed) and swap it in via `replaced-current-bundle`. The
           * bundle-identity effect disposes the previous session once it swaps,
           * which strengthens the single-refresher guarantee (the stale-token
           * session can no longer refresh).
           */
          const prevBundle = state.currentAgentState
            .agent as unknown as SessionBundle
          let newBundle!: SessionBundle
          const hooks = makeSessionHooks(
            onAgentSessionChange,
            () => newBundle.agent,
            () => syncedAccount.did,
          )
          const newSession = new PasswordSession(
            sessionAccountToSessionData(syncedAccount),
            hooks,
          )
          newBundle = buildBundle(newSession)
          hooks.arm()
          addSessionDebugLog({
            type: 'agent:patch',
            agent: newBundle.agent,
            prevSession: prevBundle.agent.session,
            nextSession: newBundle.agent.session,
          })
          store.dispatch({
            type: 'replaced-current-bundle',
            newAgent: newBundle,
            newAccount: syncedAccount,
          })
        }
      }
    })
  }, [store, state, resumeSession, onAgentSessionChange])

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

  const bundle = state.currentAgentState.agent as unknown as
    | SessionBundle
    | PublicSessionBundle
  const agent = bundle.agent

  // @ts-expect-error window type is not declared, debug only
  // eslint-disable-next-line react-hooks/immutability
  if (__DEV__ && IS_WEB) window.agent = agent

  const currentBundleRef = useRef(bundle)
  useEffect(() => {
    if (currentBundleRef.current !== bundle) {
      // Read the previous value and immediately advance the pointer.
      const prevBundle = currentBundleRef.current
      currentBundleRef.current = bundle
      addSessionDebugLog({
        type: 'agent:switch',
        prevAgent: prevBundle.agent,
        nextAgent: bundle.agent,
      })
      // We never reuse bundles so let's fully neutralize the previous one.
      // This ensures its session won't try to consume any refresh tokens.
      disposeBundle(prevBundle)
    }
  }, [bundle])

  return (
    <AgentContext.Provider value={agent}>
      <BundleContext.Provider value={bundle}>
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
      </BundleContext.Provider>
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

export function useAgent(): SessionAgent {
  const agent = useContext(AgentContext)
  if (!agent) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return agent
}

/**
 * Authenticated lex {@link Client} for appview reads. Backed by the active
 * bundle's appview client (proxied to the Bluesky appview, with labelers). Its
 * identity is stable per-bundle, so it only changes when the active account
 * changes. Falls back to the public client when there is no bundle (logged out,
 * or used outside the provider) so callers can treat it as always-present.
 */
export function useLexClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.appviewClient ?? getPublicLexClient()
}

/**
 * Alias of {@link useLexClient}: the authenticated appview client for the
 * active account.
 */
export function useAppviewClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.appviewClient ?? getPublicLexClient()
}

/**
 * The account (PDS) lex {@link Client} for the active account. Writes and record
 * mutations go here - requests hit the user's PDS directly (no appview proxy).
 * Falls back to the public client when there is no bundle.
 */
export function usePdsClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.accountClient ?? getPublicLexClient()
}
