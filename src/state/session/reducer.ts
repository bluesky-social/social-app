import {unregisterPushToken} from '#/lib/notifications/notifications'
import {logger} from '#/lib/notifications/util'
import {wrapSessionReducerForLogging} from './logging'
import {type AtpSessionEvent, createPublicSessionBundle} from './session-core'
import {type SessionAccount} from './types'
import {createTemporaryAgentsAndResume} from './util'

/*
 * A hack so that the reducer can't read anything from the session bundle. From
 * the reducer's point of view it is a completely opaque object; the only field
 * it ever reads is `service` (a URL), used for logging/snapshots. The provider
 * stores the full `SessionBundle` here, but the reducer's static type only sees
 * `service` (structural: the bundle has more, the reducer sees less).
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
       * Same-did cross-tab sync. `PasswordSession` cannot be patched in place,
       * so the provider builds a fresh bundle from the synced tokens (no
       * network - the leader tab already refreshed) and swaps it in, keeping
       * the current did and replacing the matching account entry. Does not
       * persist (synced from another tab, avoid write cycles).
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
      if (
        refreshedAccount === undefined &&
        agent !== state.currentAgentState.agent
      ) {
        // If the session got cleared out (e.g. due to expiry or network error) but
        // this account isn't the active one, don't clear it out at this time.
        // This way, if the problem is transient, it'll work on next resume.
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
        createTemporaryAgentsAndResume([account])
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
        createTemporaryAgentsAndResume([account])
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
      createTemporaryAgentsAndResume(state.accounts)
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
       * Previously this also mutated `agent.session.emailConfirmed/
       * emailAuthFactor` in place. `PasswordSession` has no public session
       * setter and mutating its returned object is fragile, so we now patch
       * only the account entry. Consumers that read these fields
       * (useAccountEmailState) read from `currentAccount` instead of
       * `agent.session` (see phase-2 design doc section 5).
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
