import {AtpSessionData} from '@atproto/api'
import {sha256} from 'js-sha256'

import {Schema} from '../persisted'
import {Action, State} from './reducer'
import {SessionAccount} from './types'

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
      type: 'agent:patch'
      agent: object
      prevSession: AtpSessionData | undefined
      nextSession: AtpSessionData
    }

export function wrapSessionReducerForLogging(reducer: Reducer): Reducer {
  return function loggingWrapper(prevState: State, action: Action): State {
    const nextState = reducer(prevState, action)
    addSessionDebugLog({type: 'reducer:call', prevState, action, nextState})
    return nextState
  }
}

export function addSessionDebugLog(log: Log) {
  try {
    const str = JSON.stringify(log, replacer, 2)
    console.log(str)
  } catch (e) {
    console.error(e)
  }
}

let agentIds = new WeakMap<object, string>()
let sessionId = Math.random().toString(36).slice(2)
let nextAgentId = 1

function getAgentId(agent: object) {
  let id = agentIds.get(agent)
  if (id === undefined) {
    id = sessionId + '::' + nextAgentId++
    agentIds.set(agent, id)
  }
  return id
}

function replacer(key: string, value: unknown) {
  if (typeof value === 'object' && value != null && 'api' in value) {
    return getAgentId(value)
  }
  if (
    typeof value === 'string' &&
    (key === 'email' || key === 'refreshJwt' || key === 'accessJwt')
  ) {
    return sha256(value)
  }
  return value
}
