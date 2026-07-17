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
import {type Client} from '@atproto/lex-client'
import {PasswordSession} from '@atproto/lex-password-session'

import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {AnalyticsContext, useAnalyticsBase, utils} from '#/analytics'
import {IS_WEB} from '#/env'
import {com} from '#/lexicons'
import {emitSessionDropped} from '../events'
import {getPublicLexClient, getUnauthenticatedClient} from './clients'
import {type Action, getInitialState, reducer, type State} from './reducer'
import {
  type AtpSessionEvent,
  buildBundle,
  createSessionBundleAndCreateAccount,
  createSessionBundleAndLogin,
  createSessionBundleAndResume,
  disposeBundle,
  makeSessionHooks,
  type PublicSessionBundle,
  sessionAccountToSessionData,
  type SessionBundle,
  sessionDataToSessionAccount,
} from './session-core'
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

/**
 * Holds the full {@link SessionBundle} (or the logged-out
 * {@link PublicSessionBundle}) for the active account. The three-client hooks
 * (`useLexClient`/`useAppviewClient`/`usePdsClient`) read from here.
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
  refreshSession: () => Promise.resolve(undefined),
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

  const onSessionChange = useCallback(
    (
      bundle: SessionBundle,
      accountDid: string,
      sessionEvent: AtpSessionEvent,
    ) => {
      // Snapshot the (mutable) live session data right away.
      const refreshedAccount =
        bundle.session && !bundle.session.destroyed
          ? sessionDataToSessionAccount(
              bundle.session.session,
              bundle.session.session.service,
            )
          : undefined
      if (sessionEvent === 'expired' || sessionEvent === 'create-failed') {
        emitSessionDropped()
      }
      /*
       * The reducer stores the whole bundle as `currentAgentState.agent` and
       * compares `action.agent` by identity to decide whether an expiry/error
       * belongs to the active account (background accounts must not be able to
       * log the current user out). The hook now hands us the bundle that fired,
       * so it IS the identity token: a same-bundle event acts on the active
       * account, a stale (background) bundle does not match and its clears are
       * ignored - matching the pre-migration semantics exactly.
       */
      store.dispatch({
        type: 'received-agent-event',
        agent: bundle,
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
        onSessionChange,
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
    [ax, store, onSessionChange, cancelPendingTask],
  )

  const login = useCallback<SessionApiContext['login']>(
    async (params, logContext) => {
      addSessionDebugLog({type: 'method:start', method: 'login'})
      const signal = cancelPendingTask()
      const {bundle, account} = await createSessionBundleAndLogin(
        params,
        onSessionChange,
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
    [ax, store, onSessionChange, cancelPendingTask],
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
        onSessionChange,
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
    [store, onSessionChange, cancelPendingTask, onboardingDispatch],
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
     * hook reads from the account rather than the session.
     * `client.call` returns the response body directly (no `{data}` wrapper).
     */
    const data = await bundle.accountClient.call(com.atproto.server.getSession)
    if (signal.aborted) return
    store.dispatch({
      type: 'partial-refresh-session',
      accountDid: bundle.session.did,
      patch: {
        emailConfirmed: data.emailConfirmed,
        emailAuthFactor: data.emailAuthFactor,
      },
    })
  }, [store, state, cancelPendingTask])

  const refreshSession = useCallback<
    SessionApiContext['refreshSession']
  >(async () => {
    const bundle = store.getState().currentAgentState.agent as unknown as
      | SessionBundle
      | PublicSessionBundle
    if (!bundle.session) return undefined // logged out: nothing to refresh
    /*
     * PasswordSession.refresh() re-runs com.atproto.server.refreshSession +
     * getSession. On success the session's onUpdated hook fires, which the
     * armed makeSessionHooks wiring maps to an 'update' event; the reducer
     * snapshots the refreshed account. No explicit dispatch is needed here.
     * The returned snapshot lets callers read post-refresh fields without
     * waiting on the (async) reducer update.
     */
    await bundle.session.refresh()
    return sessionDataToSessionAccount(
      bundle.session.session,
      bundle.session.session.service,
    )
  }, [store])

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
           * is immutable (no in-place session patch), so rebuild a fresh bundle
           * from the synced tokens WITHOUT a network call (the leader already
           * refreshed) and swap it in via `replaced-current-bundle`. The
           * bundle-identity effect disposes the previous session once it swaps,
           * which strengthens the single-refresher guarantee (the stale-token
           * session can no longer refresh).
           */
          const prevBundle = state.currentAgentState.agent as unknown as
            | SessionBundle
            | PublicSessionBundle
          let newBundle!: SessionBundle
          const hooks = makeSessionHooks(
            onSessionChange,
            () => newBundle,
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
            agent: newBundle,
            prevSession:
              prevBundle.session && !prevBundle.session.destroyed
                ? prevBundle.session.session
                : undefined,
            nextSession: newBundle.session.session,
          })
          store.dispatch({
            type: 'replaced-current-bundle',
            newAgent: newBundle,
            newAccount: syncedAccount,
          })
        }
      }
    })
  }, [store, state, resumeSession, onSessionChange])

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
      refreshSession,
    }),
    [
      createAccount,
      login,
      logoutCurrentAccount,
      logoutEveryAccount,
      resumeSession,
      removeAccount,
      partialRefreshSession,
      refreshSession,
    ],
  )

  const bundle = state.currentAgentState.agent as unknown as
    | SessionBundle
    | PublicSessionBundle

  // @ts-expect-error window type is not declared, debug only
  // eslint-disable-next-line react-hooks/immutability
  if (__DEV__ && IS_WEB) window.bundle = bundle

  const currentBundleRef = useRef(bundle)
  useEffect(() => {
    if (currentBundleRef.current !== bundle) {
      // Read the previous value and immediately advance the pointer.
      const prevBundle = currentBundleRef.current
      currentBundleRef.current = bundle
      addSessionDebugLog({
        type: 'agent:switch',
        prevAgent: prevBundle,
        nextAgent: bundle,
      })
      // We never reuse bundles so let's fully neutralize the previous one.
      // This ensures its session won't try to consume any refresh tokens.
      disposeBundle(prevBundle)
    }
  }, [bundle])

  return (
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
 *
 * Logged-out contract: returns a stable throwing client
 * ({@link getUnauthenticatedClient}) that throws `NotAuthenticatedError` on any
 * request, BEFORE any network I/O. This is the write path - it must NOT fall
 * back to the public appview, so an unauthenticated write fails immediately and
 * legibly rather than silently hitting `public.api.bsky.app`. Components may
 * safely hold this client while logged out; only calling it throws. A component
 * that genuinely branches on auth state should use {@link useMaybePdsClient}.
 */
export function usePdsClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.accountClient ?? getUnauthenticatedClient()
}

/**
 * The chat lex {@link Client} for the active account. `chat.bsky.*` calls go
 * here - proxied to `did:web:api.bsky.chat#bsky_chat`.
 *
 * Logged-out contract: returns a stable throwing client
 * ({@link getUnauthenticatedClient}) that throws `NotAuthenticatedError` on any
 * request, BEFORE any network I/O. Chat is meaningless logged out, so this must
 * NOT fall back to the public appview. A component that genuinely branches on
 * auth state should use {@link useMaybeChatClient}.
 */
export function useChatClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.chatClient ?? getUnauthenticatedClient()
}

/**
 * The account (PDS) lex {@link Client} for the active account, or `null` when
 * there is no active session (logged out, or used outside the provider).
 *
 * The escape hatch for the rare component that genuinely renders a logged-out
 * branch and must decide whether a write path is available. Prefer
 * {@link usePdsClient} for the common case (a write only reachable while
 * authenticated); do NOT reach for this hook merely to dodge the throwing
 * client's `NotAuthenticatedError`.
 */
export function useMaybePdsClient(): Client | null {
  const bundle = useContext(BundleContext)
  return bundle?.session ? bundle.accountClient : null
}

/**
 * The chat lex {@link Client} for the active account, or `null` when there is
 * no active session (logged out, or used outside the provider).
 *
 * The escape hatch for the rare component that genuinely renders a logged-out
 * branch. Prefer {@link useChatClient} for the common case; do NOT reach for
 * this hook merely to dodge the throwing client's `NotAuthenticatedError`.
 */
export function useMaybeChatClient(): Client | null {
  const bundle = useContext(BundleContext)
  return bundle?.session ? bundle.chatClient : null
}
