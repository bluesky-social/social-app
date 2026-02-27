import * as persisted from '#/state/persisted'
import {type Schema} from '#/state/persisted/schema'
import {addSessionDebugLog} from './logging'
import {type Action, getInitialState, reducer, type State} from './reducer'

export class SessionStore {
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
      persisted.write('session', persistedData)
    }
    this.listeners.forEach(listener => listener())
  }

  onUpdate = (callback: (synced: Schema['session']) => void): (() => void) => {
    return persisted.onUpdate('session', nextSession => {
      addSessionDebugLog({type: 'persisted:receive', data: nextSession})
      this.dispatch({
        type: 'synced-accounts',
        syncedAccounts: nextSession.accounts,
        syncedCurrentDid: nextSession.currentAccount?.did,
      })
      callback(nextSession)
    })
  }
}
