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

  /*
   * Failed-token loop guard for the expiry rescue below. Maps a did to the set
   * of refreshJwts that have already produced an 'expired'. Before rescuing
   * from a candidate we require its refreshJwt not be in this set, and every
   * expiry records its dying token here; a successful 'update' clears the set.
   * See the rescue docblock in onSessionChange for why this is a set (not a
   * single-shot flag) and why it stays bounded.
   */
  const failedExpiryTokensRef = useRef<Map<string, Set<string>>>(new Map())
  /*
   * Self-reference shim. The rescue path rebuilds a bundle and must wire it to
   * this same onSessionChange (so the rescued bundle's own future events flow
   * back here). Referencing onSessionChange inside its own useCallback body
   * would be an unsatisfiable exhaustive-deps cycle, so we thread it through a
   * ref kept current right after the callback is defined.
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
      /*
       * A successful refresh means this did's world is healthy again, so reset
       * its failed-token guard set (a later expiry starts a fresh rescue
       * budget).
       */
      if (sessionEvent === 'update' && sessionData) {
        failedExpiryTokensRef.current.get(accountDid)?.clear()
      }

      /*
       * Build the refreshed account from the payload the hook delivers, NOT the
       * live session getter. `PasswordSession` fires onUpdated/onDeleted BEFORE
       * it commits its internal `#sessionData` (see password-session.js), so at
       * hook time `bundle.session.session` still holds the OLD tokens (and, on
       * the expiry path, `destroyed` is still false). Reading the live getter
       * here would (a) persist stale tokens on 'update' -> eventual forced
       * logout once the real refresh token expires, and (b) keep the user
       * signed in on 'expired'. On 'update' the payload carries the new session;
       * on 'expired'/'create-failed' we force it undefined so the reducer clears
       * tokens and logs out (it treats undefined as "session gone").
       */
      const refreshedAccount =
        sessionEvent === 'update' && sessionData
          ? sessionDataToSessionAccount(sessionData, sessionData.service)
          : undefined

      /*
       * Expiry rescue (compare-and-clear + resume-from-newer). THE BUG: a stale
       * tab (frozen by Chrome, a failed localStorage write, or a native app
       * killed before its async persist landed) can wake holding a >2h-old
       * refresh token. Its refresh gets ExpiredToken, and the naive 'expired'
       * handling clears the tokens in storage and logs out EVERY tab - even
       * though another tab already rotated to a healthy generation (PDS refresh
       * tokens keep a 2h grace window after rotation).
       *
       * Fix: before letting an expiry become a logout, check whether a NEWER
       * generation for this did is known, and if so rebuild the current bundle
       * from it instead of dropping the session. The compare lives here at the
       * dispatch site (not in the reducer) because the reducer is pure and has
       * no access to persisted storage.
       *
       * Two freshness sources, tried in order:
       *  - persisted.readLatest('session'): on web this re-reads localStorage
       *    directly, covering the frozen-tab case where queued cross-tab
       *    broadcasts have not been processed yet (so both the reducer state and
       *    persisted's in-memory cache are stale). On native it equals `get`.
       *  - the reducer's accounts: on native this IS the truth; on web it is
       *    kept fresh by 'synced-accounts' broadcasts.
       * On native the two always agree, so the rescue effectively never fires
       * (the dying bundle is the only generation) and expiry falls straight
       * through to logout. On web, readLatest is what sees the healthy tokens.
       *
       * Termination: a rescued bundle that expires AGAIN now matches persisted
       * (this tab wrote nothing newer), so no newer candidate exists and it
       * falls through to a real logout. The failed-token set is the belt-and-
       * suspenders bound - each rescue consumes a strictly newer generation, so
       * the set grows by at most one per expiry and is hard-capped
       * (MAX_EXPIRY_RESCUE_GENERATIONS). A set rather than a single-shot flag is
       * required: with a flag, a second expiry would fall through to logout and
       * clobber a healthy THIRD generation another tab just wrote, recreating
       * the exact bug.
       */
      if (sessionEvent === 'expired') {
        const current = store.getState()
        const currentAgent = current.currentAgentState.agent as unknown as
          | SessionBundle
          | PublicSessionBundle
        const dyingRefreshJwt = sessionData?.refreshJwt
        /*
         * The rescue only applies when the expiring bundle IS the current one.
         * Otherwise fall through: the reducer's identity guard drops a stale
         * bundle's expiry anyway.
         */
        if (
          currentAgent === bundle &&
          current.currentAgentState.did === accountDid &&
          dyingRefreshJwt
        ) {
          /*
           * Record the dying token FIRST (at the start of handling), so a
           * rescued-then-failed generation is remembered and never rescued back
           * into.
           */
          let failedSet = failedExpiryTokensRef.current.get(accountDid)
          if (!failedSet) {
            failedSet = new Set()
            failedExpiryTokensRef.current.set(accountDid, failedSet)
          }
          failedSet.add(dyingRefreshJwt)

          /*
           * Prefer the persisted re-read over the reducer state: storage is the
           * cross-tab source of truth on web (on native they are identical).
           */
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
            /*
             * Rebuild a bundle from the newer tokens synchronously, modeled on
             * the same-did rebuild in the persisted.onUpdate handler below. No
             * expiry is dispatched and no emitSessionDropped fires - the session
             * is not dropped, it is healed.
             */
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
            /*
             * Re-snapshot through the freshly built session (fallback covers
             * the destroyed case, which cannot happen for a just-built,
             * never-armed session).
             */
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

      /*
       * Fall-through-to-logout path (no rescue was taken). emitSessionDropped
       * fires here - never on the rescue path, where the session survives.
       * 'create-failed' never fires in production but is kept for parity.
       *
       * Gate on the expiring bundle still being current: the reducer drops
       * events from non-current bundles, and disposal of a replaced bundle
       * happens in a deferred useEffect. A stale-but-still-armed bundle expiring
       * in that window must not show a spurious "session expired" toast while
       * the current session is healthy - only emit when a CURRENT bundle truly
       * expires with no rescue.
       */
      if (
        (sessionEvent === 'expired' || sessionEvent === 'create-failed') &&
        store.getState().currentAgentState.agent === bundle
      ) {
        emitSessionDropped()
      }
      /*
       * The bundle is the reducer's identity token: it stores the whole bundle
       * as `currentAgentState.agent` and compares `action.agent` by identity to
       * decide whether an event belongs to the active account. A same-bundle
       * event acts on the active account; a stale (background) bundle does not
       * match, so its events are ignored (background accounts must not be able
       * to log the current user out or resurrect tokens).
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
        /*
         * A newer task superseded this resume. The bundle is fully built and
         * armed, so its session can still consume refresh tokens - dispose it
         * before bailing (fixes a leak where an aborted resume left an armed,
         * undisposed bundle behind).
         */
        disposeBundle(bundle)
        return
      }
      /*
       * Completion bail: re-read state and drop out if this account's entry is
       * gone, or its tokens were cleared by a cross-tab logout that raced this
       * resume (the residual hole where the leader logged in X then out while
       * this follower's current did was still undefined, so the onUpdate cancel
       * in 2a did not fire). The check is on the ACCOUNTS entry, not on
       * "persisted current did": a persisted-current-did check would break
       * normal user-initiated account switching, where the target account is
       * deliberately not current yet.
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
    /*
     * Fetch through the account (PDS) client and dispatch the patch. We do NOT
     * mutate the session object (PasswordSession's data is immutable to us); the
     * reducer patches only the `accounts` entry, and the email-state hook reads
     * from the account rather than the session.
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
     * refresh() fires the session's onUpdated hook on success, which the armed
     * hooks map to an 'update' event; the reducer snapshots the refreshed
     * account, so no explicit dispatch is needed here. The returned snapshot
     * lets callers read post-refresh fields without waiting on the (async)
     * reducer update.
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
      /*
       * The leader tab's current account, but only if it still has tokens -
       * a tokenless entry means the leader logged out. When the leader logged
       * out (`syncedDid === undefined`) while THIS tab thinks it is logged in,
       * cancel any pending task so a resume racing this logout does not win and
       * dispatch a switch over the top of the synced logout. We do NOT cancel
       * unconditionally on every no-current broadcast: a logged-out tab may be
       * mid-login, and another logged-out tab removing a stored account must not
       * abort that unrelated in-flight login. resumeSession already cancels at
       * its start, so the different-did case is covered elsewhere.
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
          /*
           * Any change to ANY saved account fires persisted.onUpdate, and the
           * 'synced-accounts' dispatch above already keeps the accounts list
           * fresh. So if the CURRENT account's tokens are unchanged, a change to
           * a non-current account landed here: bail out before rebuilding, since
           * rebuild+swap would kill the live bundle (client-identity churn,
           * in-flight request kills) for no reason. Fall through to rebuild only
           * when we have no usable live session.
           */
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
          /*
           * Reapply this account's subscribed labelers to the freshly built
           * appview client: buildBundle starts with an empty per-instance
           * labeler set, and this rebuild path never runs
           * configureModerationForAccount on its own. It is fully synchronous
           * (the labeler cache is a local MMKV read), so the whole prep + arm +
           * dispatch sequence below runs in one tick from the onUpdate
           * broadcast - the new bundle enters the reducer with its labelers
           * already applied, with no window where the new session is armed but
           * the reducer still holds the old bundle.
           */
          configureModerationForAccount(newBundle, syncedAccount)
          /*
           * Defensive race guard. With the whole path synchronous, nothing can
           * have dispatched between the 'synced-accounts' dispatch above and
           * here, so these conditions are trivially satisfied today. They are
           * kept as a cheap invariant check against a future edit reintroducing
           * an await into this path: a competing rebuild, an account switch, a
           * logout, or a newer token generation would each show up as a
           * bundle-identity or token mismatch, and the stale completion must
           * drop out (self-disposing the never-installed bundle) rather than
           * clobber the newer bundle or resurrect an authenticated bundle into a
           * logged-out/other-account slot (the reducer's
           * 'replaced-current-bundle' keeps the current did and does no identity
           * check on the outgoing agent).
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
            /*
             * This bundle was never armed and never installed, so dispose it
             * here (the install path's normal disposal in the bundle-identity
             * effect will never run for it).
             */
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
          /*
           * Re-read syncedAccount's data through the freshly built session (the
           * fallbacks cover the destroyed case, which cannot happen here since
           * the session was just built synchronously and never armed).
           */
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
 * bundle's appview client (proxied to the Bluesky appview, with labelers); its
 * identity is stable per-bundle. Falls back to the public client when there is
 * no bundle (logged out, or used outside the provider) so callers can treat it
 * as always-present.
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
 * Logged out, returns a stable client ({@link getUnauthenticatedClient}) that
 * throws `NotAuthenticatedError` before any network I/O, so an unauthenticated
 * write fails loudly rather than silently hitting `public.api.bsky.app`.
 * Components may safely hold this client while logged out; only calling it
 * throws. To branch on auth state, use {@link useMaybePdsClient} instead.
 */
export function usePdsClient(): Client {
  const bundle = useContext(BundleContext)
  return bundle?.accountClient ?? getUnauthenticatedClient()
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
 * The account (PDS) lex {@link Client} for the active account, or `null` when
 * there is no active session (logged out, or used outside the provider).
 *
 * The escape hatch for the rare component that genuinely renders a logged-out
 * branch and must decide whether a write path is available. Prefer
 * {@link usePdsClient} for the common case; do NOT reach for this hook merely to
 * dodge the throwing client's `NotAuthenticatedError`.
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
