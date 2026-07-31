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
import {type Client} from '@atproto/lex'
import {PasswordSession, type SessionData} from '@atproto/lex-password-session'

import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {AnalyticsContext, useAnalyticsBase, utils} from '#/analytics'
import {IS_WEB} from '#/env'
import {com} from '#/lexicons'
import {emitSessionDropped} from '../events'
import {getPublicLexClient, getUnauthenticatedClient} from './clients'
import {configureModerationForAccount} from './moderation'
import {type Action, getInitialState, reducer, type State} from './reducer'
import {
  type AtpSessionEvent,
  buildBundle,
  createSessionBundleAndCreateAccount,
  createSessionBundleAndLogin,
  createSessionBundleAndResume,
  disposeBundle,
  makeSessionHooks,
  pickExpiryRescueCandidate,
  type PublicSessionBundle,
  registerBundleKillSwitch,
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
 * {@link PublicSessionBundle}) for the active account. The authed client hooks
 * (`useLexClient`/`useAppviewClient`/`usePdsClient`), which all return the one
 * merged `bskyClient` when signed in, read from here.
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

  // Refresh-token generations that have already failed during expiry rescue.
  const failedExpiryTokensRef = useRef<Map<string, Set<string>>>(new Map())
  /*
   * Rescued bundles need this callback for their own events. A ref avoids a
   * self-reference in the callback's dependency list.
   */
  const onSessionChangeRef = useRef<
    | ((
        bundle: SessionBundle,
        accountDid: string,
        sessionEvent: AtpSessionEvent,
        sessionData?: SessionData,
      ) => void)
    | null
  >(null)

  const onSessionChange = useCallback(
    (
      bundle: SessionBundle,
      accountDid: string,
      sessionEvent: AtpSessionEvent,
      sessionData?: SessionData,
    ) => {
      if (sessionEvent === 'update' && sessionData) {
        failedExpiryTokensRef.current.get(accountDid)?.clear()
      }

      /*
       * PasswordSession invokes its hooks before updating its live getter. Use
       * the delivered payload so a refresh persists the newly rotated tokens.
       */
      const refreshedAccount =
        sessionEvent === 'update' && sessionData
          ? sessionDataToSessionAccount(sessionData, sessionData.service)
          : undefined

      /*
       * A stale tab may expire a token after another tab has already rotated it.
       * Prefer a newer persisted or reducer generation over logging every tab
       * out. Failed generations are recorded and bounded to guarantee that a
       * repeatedly expiring session eventually falls through to logout.
       */
      if (sessionEvent === 'expired') {
        const current = store.getState()
        const currentAgent = current.currentAgentState.agent as unknown as
          | SessionBundle
          | PublicSessionBundle
        const dyingRefreshJwt = sessionData?.refreshJwt
        // Stale bundle events are handled by the reducer's identity guard.
        if (
          currentAgent === bundle &&
          current.currentAgentState.did === accountDid &&
          dyingRefreshJwt
        ) {
          let failedSet = failedExpiryTokensRef.current.get(accountDid)
          if (!failedSet) {
            failedSet = new Set()
            failedExpiryTokensRef.current.set(accountDid, failedSet)
          }
          failedSet.add(dyingRefreshJwt)

          const persistedCandidate = persisted
            .readLatest('session')
            .accounts.find(a => a.did === accountDid)
          const reducerCandidate = current.accounts.find(
            a => a.did === accountDid,
          )
          const candidate = pickExpiryRescueCandidate({
            dyingRefreshJwt,
            candidates: [persistedCandidate, reducerCandidate],
            failedRefreshJwts: failedSet,
          })

          if (candidate) {
            let newBundle!: SessionBundle
            const hooks = makeSessionHooks(
              onSessionChangeRef.current!,
              () => newBundle,
              () => candidate.did,
            )
            const newSession = new PasswordSession(
              sessionAccountToSessionData(candidate),
              hooks,
            )
            newBundle = buildBundle(newSession)
            registerBundleKillSwitch(newBundle, hooks.kill)
            configureModerationForAccount(newBundle, candidate)
            const newAccount = newBundle.session.destroyed
              ? candidate
              : (sessionDataToSessionAccount(
                  newBundle.session.session,
                  newBundle.session.session.service,
                ) ?? candidate)
            hooks.arm()
            store.dispatch({
              type: 'replaced-current-bundle',
              newAgent: newBundle,
              newAccount,
            })
            return
          }
        }
      }

      // Only the current bundle may report that its session was dropped.
      if (
        (sessionEvent === 'expired' || sessionEvent === 'create-failed') &&
        store.getState().currentAgentState.agent === bundle
      ) {
        emitSessionDropped()
      }
      // Bundle identity prevents stale sessions from changing the active account.
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
  onSessionChangeRef.current = onSessionChange

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
        // The factory returns an armed bundle, so a superseded resume must dispose it.
        disposeBundle(bundle)
        return
      }
      /*
       * A cross-tab logout may clear or remove the account while resume is in
       * flight. Check the account entry rather than the current did so ordinary
       * account switching remains valid.
       */
      const latest = store.getState()
      const latestEntry = latest.accounts.find(a => a.did === account.did)
      if (!latestEntry || !latestEntry.refreshJwt) {
        disposeBundle(bundle)
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
    /* getSession targets the PDS; only the persisted account fields are patched. */
    const data = await bundle.bskyClient.call(
      com.atproto.server.getSession,
      {},
      {service: null},
    )
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
    // The hook updates state; the return value exposes fresh fields immediately.
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
      /*
       * Cancel pending work when another tab logs out the account this tab
       * considers current. Do not cancel unrelated work between logged-out tabs.
       */
      const syncedDid = syncedAccount?.refreshJwt
        ? syncedAccount.did
        : undefined
      if (
        syncedDid === undefined &&
        state.currentAgentState.did !== undefined
      ) {
        cancelPendingTask()
      }
      if (syncedAccount && syncedAccount.refreshJwt) {
        if (syncedAccount.did !== state.currentAgentState.did) {
          // The leader refreshes before broadcasting, so followers receive fresh tokens.
          void resumeSession(syncedAccount)
        } else {
          /*
           * PasswordSession cannot be patched in place. Rebuild from the tokens
           * the leader already refreshed, then dispose the previous bundle.
           */
          const prevBundle = state.currentAgentState.agent as unknown as
            | SessionBundle
            | PublicSessionBundle
          // Avoid replacing the live bundle for an unrelated account update.
          const live =
            prevBundle.session && !prevBundle.session.destroyed
              ? prevBundle.session.session
              : undefined
          if (
            live &&
            live.accessJwt === syncedAccount.accessJwt &&
            live.refreshJwt === syncedAccount.refreshJwt
          ) {
            return
          }
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
          registerBundleKillSwitch(newBundle, hooks.kill)
          // Apply cached labelers before the new session is armed and installed.
          configureModerationForAccount(newBundle, syncedAccount)
          /*
           * If this path becomes asynchronous, do not let a stale rebuild
           * replace a newer bundle or token generation.
           */
          const current = store.getState()
          const latestAccount = current.accounts.find(
            account => account.did === syncedAccount.did,
          )
          if (
            current.currentAgentState.agent !== prevBundle ||
            latestAccount?.accessJwt !== syncedAccount.accessJwt ||
            latestAccount?.refreshJwt !== syncedAccount.refreshJwt
          ) {
            // This bundle was never installed, so the normal disposal effect cannot run.
            disposeBundle(newBundle)
            return
          }
          addSessionDebugLog({
            type: 'agent:patch',
            agent: newBundle,
            prevSession:
              prevBundle.session && !prevBundle.session.destroyed
                ? prevBundle.session.session
                : undefined,
            nextSession: newBundle.session.session,
          })
          const newAccount = newBundle.session.destroyed
            ? syncedAccount
            : (sessionDataToSessionAccount(
                newBundle.session.session,
                newBundle.session.session.service,
              ) ?? syncedAccount)
          hooks.arm()
          store.dispatch({
            type: 'replaced-current-bundle',
            newAgent: newBundle,
            newAccount,
          })
        }
      }
    })
  }, [store, state, resumeSession, onSessionChange, cancelPendingTask])

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
      const prevBundle = currentBundleRef.current
      currentBundleRef.current = bundle
      addSessionDebugLog({
        type: 'agent:switch',
        prevAgent: prevBundle,
        nextAgent: bundle,
      })
      // Replaced bundles must never consume another refresh token.
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
 * Authenticated lex {@link Client} for the active account. Backed by the active
 * bundle's single merged Bluesky client (proxied to the Bluesky appview, with
 * labelers); its identity is stable per-bundle. Falls back to the public client
 * when there is no bundle (logged out, or used outside the provider) so callers
 * can treat it as always-present.
 *
 * All three authed client hooks (this, {@link useAppviewClient},
 * {@link usePdsClient}) now return the SAME merged client for a signed-in
 * account. They differ ONLY in their logged-out fallback: this hook and
 * `useAppviewClient` fall back to the public read client, while `usePdsClient`
 * falls back to the throwing unauthenticated client.
 */
export function useLexClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.bskyClient ?? getPublicLexClient()
}

/**
 * Alias of {@link useLexClient}: the authenticated merged Bluesky client for the
 * active account, falling back to the public read client when logged out.
 */
export function useAppviewClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.bskyClient ?? getPublicLexClient()
}

/**
 * The authenticated merged Bluesky client for the active account, the SAME
 * instance returned by {@link useLexClient}/{@link useAppviewClient}. The name
 * is historical (there is no longer a separate PDS client): use this hook at
 * call sites whose requests must target the ACCOUNT HOST. Record helpers on the
 * client auto-target it (lex-client 0.3.0 defaults `service = null` per call);
 * raw `com.atproto.server`/`identity`/`sync`/`temp` calls must pass
 * `{service: null}` to strip the appview proxy.
 *
 * Logged out, returns a stable client ({@link getUnauthenticatedClient}) that
 * throws `NotAuthenticatedError` before any network I/O, so an unauthenticated
 * write fails loudly rather than silently hitting `public.api.bsky.app`. This is
 * the ONLY logged-out write protection - the public bundle now carries the
 * public read client in `bskyClient`, so this hook gates on `bundle.session`
 * (not on a distinct bundle field) to decide whether to throw. Components may
 * safely hold this client while logged out; only calling it throws. To branch
 * on auth state, use {@link useMaybePdsClient} instead.
 */
export function usePdsClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.session ? bundle.bskyClient : getUnauthenticatedClient()
}

/**
 * The chat lex {@link Client} for the active account. `chat.bsky.*` calls go
 * here - proxied to `did:web:api.bsky.chat#bsky_chat`.
 *
 * Logged out, returns a stable client ({@link getUnauthenticatedClient}) that
 * throws `NotAuthenticatedError` before any network I/O. Chat is meaningless
 * logged out, so this must NOT fall back to the public appview. To branch on
 * auth state, use {@link useMaybeChatClient} instead.
 */
export function useChatClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.chatClient ?? getUnauthenticatedClient()
}

/**
 * The authenticated merged Bluesky client for the active account (the same
 * instance {@link usePdsClient} returns when signed in), or `null` when there is
 * no active session (logged out, or used outside the provider).
 *
 * The escape hatch for the rare component that genuinely renders a logged-out
 * branch and must decide whether a write path is available. Prefer
 * {@link usePdsClient} for the common case; do NOT reach for this hook merely to
 * dodge the throwing client's `NotAuthenticatedError`.
 */
export function useMaybePdsClient(): Client | null {
  const bundle = useContext(BundleContext)
  return bundle?.session ? bundle.bskyClient : null
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
