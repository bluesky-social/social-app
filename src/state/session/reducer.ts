import {unregisterPushToken} from '#/lib/notifications/notifications'
import {logger} from '#/lib/notifications/util'
import {wrapSessionReducerForLogging} from './logging'
import {type AtpSessionEvent, createPublicSessionBundle} from './session-core'
import {type SessionAccount} from './types'
import {createTemporaryClientsAndResume} from './util'

/*
 * A hack so the reducer can't read anything from the session bundle. The
 * provider stores the full `SessionBundle` here, but the reducer's static type
 * only sees `service` (a URL, used for logging/snapshots) - structurally the
 * bundle has more, the reducer sees less.
 */
type OpaqueSessionBundle = {
  readonly service: URL
}

type AgentState = {
  readonly agent: OpaqueSessionBundle
  readonly did: string | undefined
}

export type State = {
  readonly accounts: SessionAccount[]
  readonly currentAgentState: AgentState
  needsPersist: boolean // Mutated in an effect.
}

export type Action =
  | {
      type: 'received-agent-event'
      agent: OpaqueSessionBundle
      accountDid: string
      refreshedAccount: SessionAccount | undefined
      sessionEvent: AtpSessionEvent
    }
  | {
      type: 'switched-to-account'
      newAgent: OpaqueSessionBundle
      newAccount: SessionAccount
    }
  | {
      /*
       * Swap the current bundle in place, keeping the current did and replacing
       * the matching account entry, without persisting (avoid write cycles).
       * `PasswordSession` cannot be patched in place, so the provider rebuilds a
       * fresh bundle from a set of tokens and swaps it in. Two producers:
       *
       * - Same-did cross-tab sync: the leader tab refreshed and broadcast the
       *   new tokens; this tab rebuilds from them (no network).
       * - Expiry rescue: the current bundle's refresh token expired, but a
       *   newer generation for the same did is known (from reducer state or a
       *   fresh persisted re-read), so the provider rebuilds from that newer
       *   generation instead of logging out (see onSessionChange in index.tsx).
       */
      type: 'replaced-current-bundle'
      newAgent: OpaqueSessionBundle
      newAccount: SessionAccount
    }
  | {
      type: 'removed-account'
      accountDid: string
    }
  | {
      type: 'logged-out-current-account'
    }
  | {
      type: 'logged-out-every-account'
    }
  | {
      type: 'synced-accounts'
      syncedAccounts: SessionAccount[]
      syncedCurrentDid: string | undefined
    }
  | {
      type: 'partial-refresh-session'
      accountDid: string
      patch: Pick<SessionAccount, 'emailConfirmed' | 'emailAuthFactor'>
    }

function createPublicAgentState(): AgentState {
  return {
    agent: createPublicSessionBundle(),
    did: undefined,
  }
}

export function getInitialState(persistedAccounts: SessionAccount[]): State {
  return {
    accounts: persistedAccounts,
    currentAgentState: createPublicAgentState(),
    needsPersist: false,
  }
}

let reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'received-agent-event': {
      const {agent, accountDid, refreshedAccount, sessionEvent} = action
      if (agent !== state.currentAgentState.agent) {
        /*
         * Any event from a bundle that is not the current one is dropped
         * entirely, in BOTH directions:
         *
         * - A clear (expiry/network-error, refreshedAccount === undefined) from
         *   a stale background bundle must not log the current user out. If the
         *   problem is transient, it works on the next resume.
         * - An update (refreshedAccount present) from a stale bundle must not
         *   resurrect tokens: a refresh that completes after this bundle was
         *   logged out / switched away from would otherwise write fresh tokens
         *   back into a soft-logged-out (or switched-away) account entry.
         *
         * Trade-off: a background bundle's in-flight refresh that lands inside
         * the disposal window now has its (already server-side-rotated) tokens
         * discarded. The stored generation stays valid within the PDS 2h grace
         * window, so this is strictly better than the resurrection bug.
         */
        return state
      }
      if (sessionEvent === 'network-error') {
        // Assume it's transient.
        return state
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
    case 'replaced-current-bundle': {
      const {newAgent, newAccount} = action
      return {
        ...state,
        currentAgentState: {
          did: state.currentAgentState.did,
          agent: newAgent,
        },
        accounts: state.accounts.map(a =>
          a.did === newAccount.did ? newAccount : a,
        ),
        needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
      }
    }
    case 'removed-account': {
      const {accountDid} = action

      // side effect
      const account = state.accounts.find(a => a.did === accountDid)
      if (account) {
        createTemporaryClientsAndResume([account])
          .then(agents => unregisterPushToken(agents))
          .then(() =>
            logger.debug('Push token unregistered', {did: accountDid}),
          )
          .catch(err => {
            logger.error('Failed to unregister push token', {
              did: accountDid,
              error: err,
            })
          })
      }

      return {
        accounts: state.accounts.filter(a => a.did !== accountDid),
        currentAgentState:
          state.currentAgentState.did === accountDid
            ? createPublicAgentState() // Log out if removing the current one.
            : state.currentAgentState,
        needsPersist: true,
      }
    }
    case 'logged-out-current-account': {
      const {currentAgentState} = state
      const accountDid = currentAgentState.did
      // side effect
      const account = state.accounts.find(a => a.did === accountDid)
      if (account && accountDid) {
        createTemporaryClientsAndResume([account])
          .then(agents => unregisterPushToken(agents))
          .then(() =>
            logger.debug('Push token unregistered', {did: accountDid}),
          )
          .catch(err => {
            logger.error('Failed to unregister push token', {
              did: accountDid,
              error: err,
            })
          })
      }

      return {
        accounts: state.accounts.map(a =>
          a.did === accountDid
            ? {
                ...a,
                refreshJwt: undefined,
                accessJwt: undefined,
              }
            : a,
        ),
        currentAgentState: createPublicAgentState(),
        needsPersist: true,
      }
    }
    case 'logged-out-every-account': {
      createTemporaryClientsAndResume(state.accounts)
        .then(agents => unregisterPushToken(agents))
        .then(() => logger.debug('Push token unregistered'))
        .catch(err => {
          logger.error('Failed to unregister push token', {
            error: err,
          })
        })

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
    case 'partial-refresh-session': {
      const {accountDid, patch} = action

      /*
       * Patch only the account entry: `PasswordSession` has no public session
       * setter, and consumers that read these fields (useAccountEmailState)
       * read from `currentAccount` rather than the session.
       */
      return {
        ...state,
        accounts: state.accounts.map(a => {
          if (a.did === accountDid) {
            return {
              ...a,
              emailConfirmed: patch.emailConfirmed ?? a.emailConfirmed,
              emailAuthFactor: patch.emailAuthFactor ?? a.emailAuthFactor,
            }
          }
          return a
        }),
        needsPersist: true,
      }
    }
  }
}
reducer = wrapSessionReducerForLogging(reducer)
export {reducer}
