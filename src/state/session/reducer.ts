import {unregisterPushToken} from '#/lib/notifications/notifications'
import {logger} from '#/lib/notifications/util'
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
    }
  | {
      type: 'switched-to-account'
      newBundle: OpaqueSessionBundle
      newAccount: SessionAccount
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
