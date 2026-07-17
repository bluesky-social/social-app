import {type PersistedAccount} from '#/state/persisted'
import {type Metrics} from '#/analytics/metrics'

export type SessionAccount = PersistedAccount

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
   * Calls `getSession` and updates select fields on the current account and
   * `BskyAgent`. This is an alternative to `resumeSession`, which updates
   * current account/agent using the `persistSessionHandler`, but is more load
   * bearing. This patches in updates without causing any side effects via
   * `persistSessionHandler`.
   */
  partialRefreshSession: () => Promise<void>
  /**
   * Force a full session refresh (re-runs `com.atproto.server.refreshSession`
   * plus `getSession`) and return the refreshed account snapshot, or
   * `undefined` when logged out.
   *
   * The refresh routes through the session's own `refresh()`, whose success
   * hook propagates the updated account into state; the returned snapshot lets
   * callers read post-refresh fields synchronously without waiting on the
   * (async) reducer update. Rejections propagate to the caller.
   */
  refreshSession: () => Promise<SessionAccount | undefined>
}
