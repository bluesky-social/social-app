import {BskyAgent} from '@atproto/api'

import {LogEvents} from '#/lib/statsig/statsig'
import {PersistedAccount} from '#/state/persisted'

/**
 * Alias for `PersistedAccount` from persisted storage.
 */
export type SessionAccount = PersistedAccount

/**
 * Subset of `SessionAccount` that excludes tokens.
 */
export type CurrentAccount = Omit<SessionAccount, 'accessJwt' | 'refreshJwt'>

/**
 * Context shape returned from `useSession()`
 */
export type SessionStateContext = {
  currentAgent: BskyAgent
  isInitialLoad: boolean
  isSwitchingAccounts: boolean
  hasSession: boolean
  accounts: SessionAccount[]
  /**
   * Contains the full account object persisted to storage, minus access
   * tokens.
   */
  currentAccount: CurrentAccount | undefined
}

/**
 * Context shape returned from `useSessionApi()`
 */
export type SessionApiContext = {
  createAccount: (props: {
    service: string
    email: string
    password: string
    handle: string
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  }) => Promise<void>
  login: (
    props: {
      service: string
      identifier: string
      password: string
      authFactorToken?: string | undefined
    },
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  /**
   * A full logout. Clears the `currentAccount` from session, AND removes
   * access tokens from all accounts, so that returning as any user will
   * require a full login.
   */
  logout: (
    logContext: LogEvents['account:loggedOut']['logContext'],
  ) => Promise<void>
  /**
   * A partial logout. Clears the `currentAccount` from session, but DOES NOT
   * clear access tokens from accounts, allowing the user to return to their
   * other accounts without logging in.
   *
   * Used when adding a new account, deleting an account.
   */
  clearCurrentAccount: () => void
  initSession: (account: SessionAccount) => Promise<void>
  resumeSession: (account?: SessionAccount) => Promise<void>
  removeAccount: (account: SessionAccount) => void
  selectAccount: (
    account: SessionAccount,
    logContext: LogEvents['account:loggedIn']['logContext'],
  ) => Promise<void>
  /**
   * Refreshes the BskyAgent's session and derive a fresh `currentAccount`
   */
  refreshSession: () => void
  /**
   * @deprecated Use `refreshSession` instead.
   */
  updateCurrentAccount: (
    account: Partial<
      Pick<
        SessionAccount,
        'handle' | 'email' | 'emailConfirmed' | 'emailAuthFactor'
      >
    >,
  ) => void
}
