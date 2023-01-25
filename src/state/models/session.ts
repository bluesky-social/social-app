import {makeAutoObservable, runInAction} from 'mobx'
import {
  sessionClient as AtpApi,
  Session,
  SessionServiceClient,
  ComAtprotoServerGetAccountsConfig as GetAccountsConfig,
} from '@atproto/api'
import {isObj, hasProp} from '../lib/type-guards'
import {z} from 'zod'
import {RootStoreModel} from './root-store'
import {isNetworkError} from '../../lib/errors'

export type ServiceDescription = GetAccountsConfig.OutputSchema

export const sessionData = z.object({
  service: z.string(),
  refreshJwt: z.string(),
  accessJwt: z.string(),
  handle: z.string(),
  did: z.string(),
})
export type SessionData = z.infer<typeof sessionData>

export const accountData = z.object({
  service: z.string(),
  refreshJwt: z.string().optional(),
  accessJwt: z.string().optional(),
  handle: z.string(),
  did: z.string(),
  displayName: z.string().optional(),
  aviUrl: z.string().optional(),
})
export type AccountData = z.infer<typeof accountData>

export class SessionModel {
  /**
   * Current session data
   */
  data: SessionData | null = null
  /**
   * A listing of the currently & previous sessions, used for account switching
   */
  accounts: AccountData[] = []
  online = false
  attemptingConnect = false
  private _connectPromise: Promise<boolean> | undefined

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
      serialize: false,
      hydrate: false,
    })
  }

  get hasSession() {
    return this.data !== null
  }

  get hasAccounts() {
    return this.accounts.length >= 1
  }

  get switchableAccounts() {
    return this.accounts.filter(acct => acct.did !== this.data?.did)
  }

  serialize(): unknown {
    return {
      data: this.data,
      accounts: this.accounts,
    }
  }

  hydrate(v: unknown) {
    this.accounts = []
    if (isObj(v)) {
      if (hasProp(v, 'data') && sessionData.safeParse(v.data)) {
        this.data = v.data as SessionData
      }
      if (hasProp(v, 'accounts') && Array.isArray(v.accounts)) {
        for (const account of v.accounts) {
          if (accountData.safeParse(account)) {
            this.accounts.push(account as AccountData)
          }
        }
      }
    }
  }

  clear() {
    this.data = null
    this.setOnline(false)
  }

  setState(data: SessionData) {
    this.data = data
  }

  setOnline(online: boolean, attemptingConnect?: boolean) {
    this.online = online
    if (typeof attemptingConnect === 'boolean') {
      this.attemptingConnect = attemptingConnect
    }
  }

  updateAuthTokens(session: Session) {
    if (this.data) {
      this.setState({
        ...this.data,
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
      })
    }
  }

  /**
   * Sets up the XRPC API, must be called before connecting to a service
   */
  private configureApi(): boolean {
    if (!this.data) {
      return false
    }

    try {
      const serviceUri = new URL(this.data.service)
      this.rootStore.api.xrpc.uri = serviceUri
    } catch (e: any) {
      this.rootStore.log.error(
        `Invalid service URL: ${this.data.service}. Resetting session.`,
        e,
      )
      this.clear()
      return false
    }

    this.rootStore.api.sessionManager.set({
      refreshJwt: this.data.refreshJwt,
      accessJwt: this.data.accessJwt,
    })
    return true
  }

  /**
   * Upserts the current session into the accounts
   */
  private addSessionToAccounts() {
    if (!this.data) {
      return
    }
    const existingAccount = this.accounts.find(
      acc => acc.service === this.data?.service && acc.did === this.data.did,
    )
    const newAccount = {
      service: this.data.service,
      refreshJwt: this.data.refreshJwt,
      accessJwt: this.data.accessJwt,
      handle: this.data.handle,
      did: this.data.did,
      displayName: this.rootStore.me.displayName,
      aviUrl: this.rootStore.me.avatar,
    }
    if (!existingAccount) {
      this.accounts.push(newAccount)
    } else {
      this.accounts = this.accounts
        .filter(
          acc =>
            !(acc.service === this.data?.service && acc.did === this.data.did),
        )
        .concat([newAccount])
    }
  }

  /**
   * Clears any session tokens from the accounts; used on logout.
   */
  private clearSessionTokensFromAccounts() {
    this.accounts = this.accounts.map(acct => ({
      service: acct.service,
      handle: acct.handle,
      did: acct.did,
      displayName: acct.displayName,
      aviUrl: acct.aviUrl,
    }))
  }

  /**
   * Fetches the current session from the service, if possible.
   * Requires an existing session (.data) to be populated with access tokens.
   */
  async connect(): Promise<boolean> {
    if (this._connectPromise) {
      return this._connectPromise
    }
    this._connectPromise = this._connect()
    const res = await this._connectPromise
    this._connectPromise = undefined
    return res
  }

  private async _connect(): Promise<boolean> {
    this.attemptingConnect = true
    if (!this.configureApi()) {
      return false
    }

    try {
      const sess = await this.rootStore.api.com.atproto.session.get()
      if (sess.success && this.data && this.data.did === sess.data.did) {
        this.setOnline(true, false)
        if (this.rootStore.me.did !== sess.data.did) {
          this.rootStore.me.clear()
        }
        this.rootStore.me
          .load()
          .catch(e => {
            this.rootStore.log.error(
              'Failed to fetch local user information',
              e,
            )
          })
          .then(() => {
            this.addSessionToAccounts()
          })
        return true // success
      }
    } catch (e: any) {
      if (isNetworkError(e)) {
        this.setOnline(false, false) // connection issue
        return false
      } else {
        this.clear() // invalid session cached
      }
    }

    this.setOnline(false, false)
    return false
  }

  /**
   * Helper to fetch the accounts config settings from an account.
   */
  async describeService(service: string): Promise<ServiceDescription> {
    const api = AtpApi.service(service) as SessionServiceClient
    const res = await api.com.atproto.server.getAccountsConfig({})
    return res.data
  }

  /**
   * Create a new session.
   */
  async login({
    service,
    handle,
    password,
  }: {
    service: string
    handle: string
    password: string
  }) {
    const api = AtpApi.service(service) as SessionServiceClient
    const res = await api.com.atproto.session.create({handle, password})
    if (res.data.accessJwt && res.data.refreshJwt) {
      this.setState({
        service: service,
        accessJwt: res.data.accessJwt,
        refreshJwt: res.data.refreshJwt,
        handle: res.data.handle,
        did: res.data.did,
      })
      this.configureApi()
      this.setOnline(true, false)
      this.rootStore.me
        .load()
        .catch(e => {
          this.rootStore.log.error('Failed to fetch local user information', e)
        })
        .then(() => {
          this.addSessionToAccounts()
        })
    }
  }

  /**
   * Attempt to resume a session that we still have access tokens for.
   */
  async resumeSession(account: AccountData): Promise<boolean> {
    if (!(account.accessJwt && account.refreshJwt && account.service)) {
      return false
    }

    // test that the session is good
    const api = AtpApi.service(account.service)
    api.sessionManager.set({
      refreshJwt: account.refreshJwt,
      accessJwt: account.accessJwt,
    })
    try {
      const sess = await api.com.atproto.session.get()
      if (
        !sess.success ||
        sess.data.did !== account.did ||
        !api.sessionManager.session
      ) {
        return false
      }

      // copy over the access tokens, as they may have refreshed during the .get() above
      runInAction(() => {
        account.refreshJwt = api.sessionManager.session?.refreshJwt
        account.accessJwt = api.sessionManager.session?.accessJwt
      })
    } catch (_e) {
      return false
    }

    // session is good, connect
    this.setState({
      service: account.service,
      accessJwt: account.accessJwt,
      refreshJwt: account.refreshJwt,
      handle: account.handle,
      did: account.did,
    })
    return this.connect()
  }

  async createAccount({
    service,
    email,
    password,
    handle,
    inviteCode,
  }: {
    service: string
    email: string
    password: string
    handle: string
    inviteCode?: string
  }) {
    const api = AtpApi.service(service) as SessionServiceClient
    const res = await api.com.atproto.account.create({
      handle,
      password,
      email,
      inviteCode,
    })
    if (res.data.accessJwt && res.data.refreshJwt) {
      this.setState({
        service: service,
        accessJwt: res.data.accessJwt,
        refreshJwt: res.data.refreshJwt,
        handle: res.data.handle,
        did: res.data.did,
      })
      this.rootStore.onboard.start()
      this.configureApi()
      this.rootStore.me
        .load()
        .catch(e => {
          this.rootStore.log.error('Failed to fetch local user information', e)
        })
        .then(() => {
          this.addSessionToAccounts()
        })
    }
  }

  /**
   * Close all sessions across all accounts.
   */
  async logout() {
    /*if (this.hasSession) {
      this.rootStore.api.com.atproto.session.delete().catch((e: any) => {
        this.rootStore.log.warn(
          '(Minor issue) Failed to delete session on the server',
          e,
        )
      })
    }*/
    this.clearSessionTokensFromAccounts()
    this.rootStore.clearAll()
  }
}
