import {unregisterPushToken} from '#/lib/notifications/notifications'
import {logger} from '#/lib/notifications/util'
import {type Schema} from '#/state/persisted/schema'
import {wrapSessionReducerForLogging} from './logging'
import {createPublicSessionBundle} from './session-core'
import {type AtpSessionEvent, type SessionAccount} from './types'
import {createTemporaryClientsAndResume} from './util'

// Keep session internals outside the reducer's static view of a bundle.
type OpaqueSessionBundle = {
  readonly service: URL
}

type BundleState = {
  readonly bundle: OpaqueSessionBundle
  readonly did: string | undefined
}

export type State = {
  readonly accounts: SessionAccount[]
  readonly currentBundleState: BundleState
  needsPersist: boolean // Cleared after persistence is scheduled.
}

export type Action =
  | {
      type: 'received-session-event'
      bundle: OpaqueSessionBundle
      accountDid: string
      refreshedAccount: SessionAccount | undefined
      sessionEvent: AtpSessionEvent
      /** The token that failed, used to preserve a newer concurrent generation. */
      expiredRefreshJwt?: string
    }
  | {
      type: 'switched-to-account'
      newBundle: OpaqueSessionBundle
      newAccount: SessionAccount
      /** Whether this action obtained a fresh credential generation. */
      tokenUpdate?: 'login' | 'refresh'
    }
  | {
      // Replace an immutable session from synced or rescued tokens without rebroadcasting.
      type: 'replaced-current-bundle'
      newBundle: OpaqueSessionBundle
      newAccount: SessionAccount
    }
  | {
      type: 'removed-account'
      accountDid: string
    }
  | {
      type: 'logged-out-current-account'
      /** Omitted only by legacy reducer tests; production always supplies it. */
      accountDid?: string
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

/**
 * Rebase a pending session write over the newest persisted snapshot.
 *
 * Browser tabs hold independent in-memory session state. A tab which missed a
 * token-rotation broadcast may still need to persist unrelated metadata. The
 * persisted layer can protect other root keys, but it cannot tell whether the
 * complete `session` value it receives contains an older credential generation.
 * Keep the newest stored credential pair unless this action is known to have
 * obtained a fresh pair or intentionally cleared it.
 */
export function rebasePersistedSession(
  latest: Schema['session'],
  desired: Schema['session'],
  action: Action,
): Schema['session'] {
  const latestByDid = new Map(
    latest.accounts.map(account => [account.did, account]),
  )
  const desiredDids = new Set(desired.accounts.map(account => account.did))
  const removedDid =
    action.type === 'removed-account' ? action.accountDid : undefined
  const preservedNewerTokenDids = new Set<string>()

  const accounts = desired.accounts.flatMap(desiredAccount => {
    const latestAccount = latestByDid.get(desiredAccount.did)
    if (!latestAccount) {
      /* Only an explicit fresh login may introduce an account absent from storage. */
      return shouldAddMissingAccount(action, desiredAccount.did)
        ? [desiredAccount]
        : []
    }

    const tokenMode = getTokenWriteMode(
      action,
      desiredAccount.did,
      latestAccount,
    )
    if (tokenMode === 'keep-latest') {
      if (latestAccount.refreshJwt !== desiredAccount.refreshJwt) {
        preservedNewerTokenDids.add(desiredAccount.did)
      }
      return [
        {
          ...desiredAccount,
          accessJwt: latestAccount.accessJwt,
          refreshJwt: latestAccount.refreshJwt,
        },
      ]
    }
    return [desiredAccount]
  })

  /* A stale tab must not discard an account another tab added meanwhile. */
  for (const latestAccount of latest.accounts) {
    if (
      !desiredDids.has(latestAccount.did) &&
      latestAccount.did !== removedDid
    ) {
      accounts.push(
        action.type === 'logged-out-every-account'
          ? {...latestAccount, accessJwt: undefined, refreshJwt: undefined}
          : latestAccount,
      )
    }
  }

  const desiredCurrentDid = desired.currentAccount?.did
  const latestCurrentDid = latest.currentAccount?.did
  const currentDid = selectCurrentDid({
    action,
    desiredCurrentDid,
    latestCurrentDid,
    preservedNewerTokenDids,
  })

  return {
    accounts,
    currentAccount: accounts.find(account => account.did === currentDid),
  }
}

function shouldAddMissingAccount(action: Action, did: string): boolean {
  return (
    action.type === 'switched-to-account' &&
    action.newAccount.did === did &&
    action.tokenUpdate === 'login'
  )
}

function getTokenWriteMode(
  action: Action,
  did: string,
  latestAccount: SessionAccount,
): 'replace' | 'clear' | 'keep-latest' {
  switch (action.type) {
    case 'logged-out-current-account':
      return action.accountDid === undefined || action.accountDid === did
        ? 'clear'
        : 'keep-latest'
    case 'logged-out-every-account':
      return 'clear'
    case 'received-session-event':
      if (action.sessionEvent === 'update' && action.refreshedAccount) {
        /* A remote logout wins over an in-flight local refresh. */
        return latestAccount.refreshJwt ? 'replace' : 'keep-latest'
      }
      if (action.sessionEvent === 'expired') {
        return latestAccount.refreshJwt &&
          latestAccount.refreshJwt !== action.expiredRefreshJwt
          ? 'keep-latest'
          : 'clear'
      }
      return 'keep-latest'
    case 'switched-to-account':
      if (action.newAccount.did !== did) return 'keep-latest'
      if (action.tokenUpdate === 'login') return 'replace'
      if (action.tokenUpdate === 'refresh' && latestAccount.refreshJwt) {
        return 'replace'
      }
      return 'keep-latest'
    default:
      return 'keep-latest'
  }
}

function selectCurrentDid({
  action,
  desiredCurrentDid,
  latestCurrentDid,
  preservedNewerTokenDids,
}: {
  action: Action
  desiredCurrentDid: string | undefined
  latestCurrentDid: string | undefined
  preservedNewerTokenDids: Set<string>
}): string | undefined {
  switch (action.type) {
    case 'switched-to-account':
    case 'removed-account':
    case 'logged-out-current-account':
    case 'logged-out-every-account':
      return desiredCurrentDid
    case 'received-session-event':
      if (
        action.sessionEvent === 'expired' &&
        action.accountDid !== undefined &&
        preservedNewerTokenDids.has(action.accountDid)
      ) {
        return latestCurrentDid
      }
      return action.sessionEvent === 'expired'
        ? desiredCurrentDid
        : (latestCurrentDid ?? desiredCurrentDid)
    default:
      return latestCurrentDid ?? desiredCurrentDid
  }
}

function createPublicBundleState(): BundleState {
  return {
    bundle: createPublicSessionBundle(),
    did: undefined,
  }
}

export function getInitialState(persistedAccounts: SessionAccount[]): State {
  return {
    accounts: persistedAccounts,
    currentBundleState: createPublicBundleState(),
    needsPersist: false,
  }
}

let reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'received-session-event': {
      const {bundle, accountDid, refreshedAccount, sessionEvent} = action
      if (bundle !== state.currentBundleState.bundle) {
        /*
         * Stale bundles must neither log out the current account nor restore
         * tokens after logout or an account switch.
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
        currentBundleState: refreshedAccount
          ? state.currentBundleState
          : createPublicBundleState(), // Log out if expired.
        needsPersist: true,
      }
    }
    case 'switched-to-account': {
      const {newAccount, newBundle} = action
      return {
        accounts: [
          newAccount,
          ...state.accounts.filter(a => a.did !== newAccount.did),
        ],
        currentBundleState: {
          did: newAccount.did,
          bundle: newBundle,
        },
        needsPersist: true,
      }
    }
    case 'replaced-current-bundle': {
      const {newBundle, newAccount} = action
      return {
        ...state,
        currentBundleState: {
          did: state.currentBundleState.did,
          bundle: newBundle,
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
          .then(clients => unregisterPushToken(clients))
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
        currentBundleState:
          state.currentBundleState.did === accountDid
            ? createPublicBundleState() // Log out if removing the current one.
            : state.currentBundleState,
        needsPersist: true,
      }
    }
    case 'logged-out-current-account': {
      const {currentBundleState} = state
      const accountDid = currentBundleState.did
      // side effect
      const account = state.accounts.find(a => a.did === accountDid)
      if (account && accountDid) {
        createTemporaryClientsAndResume([account])
          .then(clients => unregisterPushToken(clients))
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
        currentBundleState: createPublicBundleState(),
        needsPersist: true,
      }
    }
    case 'logged-out-every-account': {
      createTemporaryClientsAndResume(state.accounts)
        .then(clients => unregisterPushToken(clients))
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
        currentBundleState: createPublicBundleState(),
        needsPersist: true,
      }
    }
    case 'synced-accounts': {
      const {syncedAccounts, syncedCurrentDid} = action
      return {
        accounts: syncedAccounts,
        currentBundleState:
          syncedCurrentDid === state.currentBundleState.did
            ? state.currentBundleState
            : createPublicBundleState(), // Log out if different user.
        needsPersist: false, // Synced from another tab. Don't persist to avoid cycles.
      }
    }
    case 'partial-refresh-session': {
      const {accountDid, patch} = action

      // PasswordSession has no setter; consumers read these fields from the account.
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
