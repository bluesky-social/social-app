import {LogEvents} from '#/lib/statsig/statsig'
import {PersistedAccount} from '#/state/persisted'

export type SessionAccount = PersistedAccount

export type SessionStateContext = {
  accounts: SessionAccount[]
  currentAccount: SessionAccount | undefined
  hasSession: boolean
}

export type SessionApiContext = {
  createAccount: (props: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
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
  logout: (logContext: LogEvents['account:loggedOut']['logContext']) => void
  resumeSession: (account: SessionAccount) => Promise<void>
  removeAccount: (account: SessionAccount) => void
}
