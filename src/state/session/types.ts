import {type PersistedAccount} from '#/state/persisted'
import {type Metrics} from '#/analytics/metrics'

export type SessionAccount = PersistedAccount

/** Session-change events understood by the reducer and logging hooks. */
export type AtpSessionEvent = 'update' | 'expired' | 'network-error'

export type SessionStateContext = {
  accounts: SessionAccount[]
  currentAccount: SessionAccount | undefined
  hasSession: boolean
}

export type SessionApiContext = {
  createAccount: (
    props: {
      service: string
      email: string
      password: string
      handle: string
      birthDate: Date
      inviteCode?: string
      verificationPhone?: string
      verificationCode?: string
    },
    metrics: Metrics['account:create:success'],
  ) => Promise<void>
  login: (
    props: {
      service: string
      identifier: string
      password: string
      authFactorToken?: string | undefined
    },
    logContext: Metrics['account:loggedIn']['logContext'],
  ) => Promise<void>
  logoutCurrentAccount: (
    logContext: Metrics['account:loggedOut']['logContext'],
  ) => void
  logoutEveryAccount: (
    logContext: Metrics['account:loggedOut']['logContext'],
  ) => void
  resumeSession: (
    account: SessionAccount,
    isSwitchingAccounts?: boolean,
  ) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  /**
   * Calls `getSession` and patches the email fields of the current account.
   * Unlike `resumeSession`, this does not rotate tokens or rebuild the session,
   * so it produces no session-change side effects.
   */
  partialRefreshSession: () => Promise<void>
  /**
   * Rotates the session's tokens and resolves with the resulting account
   * snapshot, or `undefined` when logged out.
   *
   * Rejects when nothing was rotated, so a resolved promise means "tokens
   * rotated". Every caller relies on that: the verification dialogs close on
   * resolution, and `SignupQueued` re-checks the token scope.
   *
   * The snapshot is returned rather than read off `currentAccount`, because the
   * session's `onUpdated` hook -> `store.dispatch` path is a render cycle away
   * and `SignupQueued` branches synchronously on the fresh `accessJwt`.
   */
  refreshSession: () => Promise<SessionAccount | undefined>
}
