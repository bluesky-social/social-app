import {type LogEvents} from '#/lib/statsig/statsig'
import {type PersistedAccount} from '#/state/persisted'

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
    metrics: LogEvents['account:create:success'],
  ) => Promise<void>
  login: (
    props: {
      service: string
      identifier: string
      password: string
      authFactorToken?: string | undefined
    },
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  logoutCurrentAccount: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => void
  logoutEveryAccount: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => void
  resumeSession: (account: SessionAccount) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  /**
   * Calls `getSession` and updates select fields on the current account and
   * `BskyAgent`. This is an alternative to `resumeSession`, which updates
   * current account/agent using the `persistSessionHandler`, but is more load
   * bearing. This patches in updates without causing any side effects via
   * `persistSessionHandler`.
   */
  partialRefreshSession: () => Promise<void>
}
