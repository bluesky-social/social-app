import {type Schema} from '../persisted'
import {type Action, type State} from './reducer'
import {type AtpSessionEvent} from './session-core'
import {type SessionAccount} from './types'

type Reducer = (state: State, action: Action) => State

type Log =
  | {
      type: 'reducer:init'
      state: State
    }
  | {
      type: 'reducer:call'
      action: Action
      prevState: State
      nextState: State
    }
  | {
      type: 'method:start'
      method:
        | 'createAccount'
        | 'login'
        | 'logout'
        | 'resumeSession'
        | 'removeAccount'
      account?: SessionAccount
    }
  | {
      type: 'method:end'
      method:
        | 'createAccount'
        | 'login'
        | 'logout'
        | 'resumeSession'
        | 'removeAccount'
      account?: SessionAccount
    }
  | {
      type: 'persisted:broadcast'
      data: Schema['session']
    }
  | {
      type: 'persisted:receive'
      data: Schema['session']
    }
  | {
      type: 'agent:switch'
      prevAgent: object
      nextAgent: object
    }
  | {
      /*
       * Dev-only bundle-swap log. The bundle is treated as an opaque object
       * (the reducer never reads its internals); the session snapshots are
       * plain objects captured for debugging.
       */
      type: 'agent:patch'
      agent: object
      prevSession: object | undefined
      nextSession: object | undefined
    }

export function wrapSessionReducerForLogging(reducer: Reducer): Reducer {
  return function loggingWrapper(prevState: State, action: Action): State {
    const nextState = reducer(prevState, action)
    addSessionDebugLog({type: 'reducer:call', prevState, action, nextState})
    return nextState
  }
}

/**
 * Stubs, previously used to log session errors to Statsig. We may revive this
 * using Sentry or Bitdrift in the future.
 */
export function addSessionErrorLog(_did: string, _event: AtpSessionEvent) {}
export function addSessionDebugLog(_log: Log) {}
