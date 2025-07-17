import {type AtpAgent, type AtpSessionEvent} from '@atproto/api'

import {unregisterPushToken} from '#/lib/notifications/notifications'
import {logger} from '#/lib/notifications/util'
import {createPublicAgent} from './agent'
import {wrapSessionReducerForLogging} from './logging'
import {type SessionAccount} from './types'

// A hack so that the reducer can't read anything from the agent.
// From the reducer's point of view, it should be a completely opaque object.
type OpaqueBskyAgent = {
  readonly service: URL
  readonly api: unknown
  readonly app: unknown
  readonly com: unknown
}

type AgentState = {
  readonly agent: OpaqueBskyAgent
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
      agent: OpaqueBskyAgent
      accountDid: string
      refreshedAccount: SessionAccount | undefined
      sessionEvent: AtpSessionEvent
    }
  | {
      type: 'switched-to-account'
      newAgent: OpaqueBskyAgent
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
    agent: createPublicAgent(),
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
    case 'removed-account': {
      const {accountDid} = action

      // side effect
      const account = state.accounts.find(a => a.did === accountDid)
      if (account) {
        unregisterPushToken(accountDid, account.service?.includes('staging'))
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
        unregisterPushToken(accountDid, account.service?.includes('staging'))
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
      for (const account of state.accounts) {
        const accountDid = account.did
        unregisterPushToken(accountDid, account.service?.includes('staging'))
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
      const agent = state.currentAgentState.agent as AtpAgent

      /*
       * Only mutating values that are safe. Be very careful with this.
       */
      if (agent.session) {
        agent.session.emailConfirmed =
          patch.emailConfirmed ?? agent.session.emailConfirmed
        agent.session.emailAuthFactor =
          patch.emailAuthFactor ?? agent.session.emailAuthFactor
      }

      return {
        ...state,
        currentAgentState: {
          ...state.currentAgentState,
          agent,
        },
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
