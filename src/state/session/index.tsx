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
import {type AtpAgent} from '@atproto/api'
import {type SessionData} from '@atproto/lex-password-session'

import * as persisted from '#/state/persisted'
import {useCloseAllActiveElements} from '#/state/util'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {AnalyticsContext, useAnalyticsBase, utils} from '#/analytics'
import {IS_WEB} from '#/env'
import {emitSessionDropped} from '../events'
import {createSessionBundleAndCreateAccount} from './create-account'
import {pickExpiryRescueCandidate} from './expiry-rescue'
import {type Action, getInitialState, reducer, type State} from './reducer'
import {
  type AtpSessionEvent,
  createSessionBundleAndLogin,
  createSessionBundleAndResume,
  createSessionBundleFromStoredAccount,
  disposeBundle,
  type PublicSessionBundle,
  type SessionBundle,
  sessionDataToSessionAccount,
} from './session-core'
export {isSignupQueued} from './session-data'
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

/** Active account bundle, or the public bundle when logged out. */
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
          a => a.did === nextState.currentBundleState.did,
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
        const currentBundle = current.currentBundleState.bundle as unknown as
          | SessionBundle
          | PublicSessionBundle
        const dyingRefreshJwt = sessionData?.refreshJwt
        // Stale bundle events are handled by the reducer's identity guard.
        if (
          currentBundle === bundle &&
          current.currentBundleState.did === accountDid &&
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
            const rebuilt = createSessionBundleFromStoredAccount(
              candidate,
              onSessionChangeRef.current!,
            )
            if (rebuilt) {
              store.dispatch({
                type: 'replaced-current-bundle',
                newBundle: rebuilt.bundle,
                newAccount: rebuilt.account,
              })
              return
            }
          }
        }
      }

      // Only the current bundle may report that its session was dropped.
      if (
        sessionEvent === 'expired' &&
        store.getState().currentBundleState.bundle === bundle
      ) {
        emitSessionDropped()
      }
      // Bundle identity prevents stale sessions from changing the active account.
      store.dispatch({
        type: 'received-session-event',
        bundle,
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
        newBundle: bundle,
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
        newBundle: bundle,
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
              a => a.did === prevState.currentBundleState.did,
            ),
          ),
        },
      )
      addSessionDebugLog({type: 'method:end', method: 'logout'})
      if (prevState.currentBundleState.did) {
        clearAgeAssuranceServerDataForDid({
          did: prevState.currentBundleState.did,
        })
        void clearPersistedQueryStorage(prevState.currentBundleState.did)
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
              a => a.did === prevState.currentBundleState.did,
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
        newBundle: bundle,
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
    const bundle = state.currentBundleState.bundle as unknown as SessionBundle
    const signal = cancelPendingTask()
    /* getSession targets the PDS; only the persisted account fields are patched. */
    const {data} = await bundle.agent.com.atproto.server.getSession()
    if (signal.aborted) return
    store.dispatch({
      type: 'partial-refresh-session',
      /*
       * Read the did off the response rather than the session: the bundle may
       * have been disposed while the request was in flight, and the live
       * getters throw in that state.
       */
      accountDid: data.did,
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
      /*
       * Cancel pending work when another tab logs out the account this tab
       * considers current. Do not cancel unrelated work between logged-out tabs.
       */
      const syncedDid = syncedAccount?.refreshJwt
        ? syncedAccount.did
        : undefined
      if (
        syncedDid === undefined &&
        state.currentBundleState.did !== undefined
      ) {
        cancelPendingTask()
      }
      if (syncedAccount && syncedAccount.refreshJwt) {
        if (syncedAccount.did !== state.currentBundleState.did) {
          // The leader refreshes before broadcasting, so followers receive fresh tokens.
          void resumeSession(syncedAccount)
        } else {
          /*
           * PasswordSession cannot be patched in place. Rebuild from the tokens
           * the leader already refreshed, then dispose the previous bundle.
           */
          const prevBundle = state.currentBundleState.bundle as unknown as
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
          const rebuilt = createSessionBundleFromStoredAccount(
            syncedAccount,
            onSessionChange,
            newBundle => {
              const current = store.getState()
              const latestAccount = current.accounts.find(
                account => account.did === syncedAccount.did,
              )
              const isCurrent =
                current.currentBundleState.bundle === prevBundle &&
                latestAccount?.accessJwt === syncedAccount.accessJwt &&
                latestAccount?.refreshJwt === syncedAccount.refreshJwt
              if (isCurrent) {
                addSessionDebugLog({
                  type: 'bundle:patch',
                  bundle: newBundle,
                  prevSession:
                    prevBundle.session && !prevBundle.session.destroyed
                      ? prevBundle.session.session
                      : undefined,
                  nextSession: newBundle.session.session,
                })
              }
              return isCurrent
            },
          )
          if (!rebuilt) {
            return
          }
          const {bundle: newBundle, account: newAccount} = rebuilt
          store.dispatch({
            type: 'replaced-current-bundle',
            newBundle,
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
        a => a.did === state.currentBundleState.did,
      ),
      hasSession: !!state.currentBundleState.did,
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

  const bundle = state.currentBundleState.bundle as unknown as
    | SessionBundle
    | PublicSessionBundle

  // @ts-expect-error window type is not declared, debug only
  // eslint-disable-next-line react-hooks/immutability
  if (__DEV__ && IS_WEB) window.agent = bundle.agent

  const currentBundleRef = useRef(bundle)
  useEffect(() => {
    if (currentBundleRef.current !== bundle) {
      const prevBundle = currentBundleRef.current
      currentBundleRef.current = bundle
      addSessionDebugLog({
        type: 'bundle:switch',
        prevBundle,
        nextBundle: bundle,
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
 * The active session's agent, or the public agent when logged out.
 */
export function useAgent(): AtpAgent {
  const bundle = useContext(BundleContext)
  if (!bundle) {
    throw Error('useAgent() must be below <SessionProvider>.')
  }
  return bundle.agent
}
