import {AtpSessionEvent} from '@atproto/api'

import {createPublicAgent} from './agent'
import {SessionAccount} from './types'

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
      type: 'logged-out'
    }
  | {
      type: 'synced-accounts'
      syncedAccounts: SessionAccount[]
      syncedCurrentDid: string | undefined
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

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'received-agent-event': {
      const {agent, accountDid, refreshedAccount, sessionEvent} = action
      if (agent !== state.currentAgentState.agent) {
        // Only consider events from the active agent.
        return state
      }
      if (sessionEvent === 'network-error') {
        // Don't change stored accounts but kick to the choose account screen.
        return {
          accounts: state.accounts,
          currentAgentState: createPublicAgentState(),
          needsPersist: true,
        }
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
      return {
        accounts: state.accounts.filter(a => a.did !== accountDid),
        currentAgentState:
          state.currentAgentState.did === accountDid
            ? createPublicAgentState() // Log out if removing the current one.
            : state.currentAgentState,
        needsPersist: true,
      }
    }
    case 'logged-out': {
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
  }
}
