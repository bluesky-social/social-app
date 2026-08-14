import {type SessionData} from '@atproto/lex-password-session'

import {type Schema} from '../persisted'
import {type Action, type State} from './reducer'
import {type AtpSessionEvent, type SessionAccount} from './types'

type Reducer = (state: State, action: Action) => State

/**
 * An account reduced to the fields that are safe to ship off-device.
 *
 * Credentials become presence booleans and PII (email, service, pdsUrl) is
 * dropped entirely. The log only ever needs to answer "which account was live,
 * and did it still hold credentials?". The stubs at the bottom of this file are
 * expected to be revived against Sentry or Bitdrift, so no payload type may be
 * capable of carrying a live JWT in the first place.
 */
export type RedactedAccount = {
  did: string
  handle: string
  active: boolean | undefined
  status: string | undefined
  signupQueued: boolean | undefined
  hasAccessJwt: boolean
  hasRefreshJwt: boolean
}

/** The account list plus the current did, in redacted form. */
export type RedactedSessionSnapshot = {
  accounts: RedactedAccount[]
  currentDid: string | undefined
}

/** Live session data reduced to identity plus credential presence. */
export type RedactedSessionData = {
  did: string
  handle: string
  hasAccessJwt: boolean
  hasRefreshJwt: boolean
}

function redact(account: SessionAccount): RedactedAccount {
  return {
    did: account.did,
    handle: account.handle,
    active: account.active,
    status: account.status,
    signupQueued: account.signupQueued,
    hasAccessJwt: !!account.accessJwt,
    hasRefreshJwt: !!account.refreshJwt,
  }
}

export function redactAccount(
  account: SessionAccount | undefined,
): RedactedAccount | undefined {
  return account ? redact(account) : undefined
}

export function redactState(state: State): RedactedSessionSnapshot {
  return {
    accounts: state.accounts.map(redact),
    currentDid: state.currentBundleState.did,
  }
}

export function redactPersistedSession(
  data: Schema['session'],
): RedactedSessionSnapshot {
  return {
    accounts: data.accounts.map(redact),
    currentDid: data.currentAccount?.did,
  }
}

export function redactSessionData(
  data: SessionData | undefined,
): RedactedSessionData | undefined {
  if (!data) return undefined
  return {
    did: data.did,
    handle: data.handle,
    hasAccessJwt: !!data.accessJwt,
    hasRefreshJwt: !!data.refreshJwt,
  }
}

/*
 * Bundles are logged for identity only - which one was live, and which one
 * replaced it. Logging the object itself would reach its session, and through
 * it the tokens, so each is mapped to an opaque per-run id instead.
 */
const bundleIds = new WeakMap<object, string>()
const runId = Math.random().toString(36).slice(2)
let nextBundleId = 1

export function getBundleId(bundle: object): string {
  let id = bundleIds.get(bundle)
  if (id === undefined) {
    id = runId + '::' + nextBundleId++
    bundleIds.set(bundle, id)
  }
  return id
}

/** An action reduced to its discriminant plus the did it targets, if any. */
type RedactedAction = {
  type: Action['type']
  accountDid?: string
}

function redactAction(action: Action): RedactedAction {
  switch (action.type) {
    case 'received-session-event':
    case 'removed-account':
    case 'partial-refresh-session':
      return {type: action.type, accountDid: action.accountDid}
    case 'switched-to-account':
    case 'replaced-current-bundle':
      return {type: action.type, accountDid: action.newAccount.did}
    case 'synced-accounts':
      return {type: action.type, accountDid: action.syncedCurrentDid}
    default:
      return {type: action.type}
  }
}

type Log =
  | {
      type: 'reducer:init'
      state: RedactedSessionSnapshot
    }
  | {
      type: 'reducer:call'
      action: RedactedAction
      prevState: RedactedSessionSnapshot
      nextState: RedactedSessionSnapshot
    }
  | {
      type: 'method:start'
      method:
        'createAccount' | 'login' | 'logout' | 'resumeSession' | 'removeAccount'
      account?: RedactedAccount
    }
  | {
      type: 'method:end'
      method:
        'createAccount' | 'login' | 'logout' | 'resumeSession' | 'removeAccount'
      account?: RedactedAccount
    }
  | {
      type: 'persisted:broadcast'
      data: RedactedSessionSnapshot
    }
  | {
      type: 'persisted:receive'
      data: RedactedSessionSnapshot
    }
  | {
      type: 'bundle:switch'
      prevBundleId: string
      nextBundleId: string
    }
  | {
      /*
       * Dev-only bundle-swap log. Bundles are identified by their opaque ids;
       * the session snapshots record only identity and credential presence.
       */
      type: 'bundle:patch'
      bundleId: string
      prevSession: RedactedSessionData | undefined
      nextSession: RedactedSessionData | undefined
    }

export function wrapSessionReducerForLogging(reducer: Reducer): Reducer {
  return function loggingWrapper(prevState: State, action: Action): State {
    const nextState = reducer(prevState, action)
    addSessionDebugLog({
      type: 'reducer:call',
      prevState: redactState(prevState),
      action: redactAction(action),
      nextState: redactState(nextState),
    })
    return nextState
  }
}

/**
 * Stubs, previously used to log session errors to Statsig. We may revive this
 * using Sentry or Bitdrift in the future.
 */
export function addSessionErrorLog(_did: string, _event: AtpSessionEvent) {}
export function addSessionDebugLog(_log: Log) {}
