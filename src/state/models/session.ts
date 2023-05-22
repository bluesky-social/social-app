import {makeAutoObservable, runInAction} from 'mobx'
import {
  BskyAgent,
  AtpSessionEvent,
  AtpSessionData,
  ComAtprotoServerDescribeServer as DescribeServer,
} from '@atproto/api'
import normalizeUrl from 'normalize-url'
import {isObj, hasProp} from 'lib/type-guards'
import {networkRetry} from 'lib/async/retry'
import {z} from 'zod'
import {RootStoreModel} from './root-store'

export type ServiceDescription = DescribeServer.OutputSchema

export const activeSession = z.object({
  service: z.string(),
  did: z.string(),
})
export type ActiveSession = z.infer<typeof activeSession>

export const accountData = z.object({
  service: z.string(),
  refreshJwt: z.string().optional(),
  accessJwt: z.string().optional(),
  handle: z.string(),
  did: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  aviUrl: z.string().optional(),
})
export type AccountData = z.infer<typeof accountData>

interface AdditionalAccountData {
  displayName?: string
  aviUrl?: string
}

export class SessionModel {
  // DEBUG
  // emergency log facility to help us track down this logout issue
  // remove when resolved
  // -prf
  _log(message: string, details?: Record<string, any>) {
    details = details || {}
    details.state = {
      data: this.data,
      accounts: this.accounts.map(
        a =>
          `${!!a.accessJwt && !!a.refreshJwt ? '✅' : '❌'} ${a.handle} (${
            a.service
          })`,
      ),
      isResumingSession: this.isResumingSession,
    }
    this.rootStore.log.debug(message, details)
  }

  /**
   * Currently-active session
   */
  data: ActiveSession | null = null
  /**
   * A listing of the currently & previous sessions
   */
  accounts: AccountData[] = []
  /**
   * Flag to indicate if we're doing our initial-load session resumption
   */
  isResumingSession = false

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {
      rootStore: false,
      serialize: false,
      hydrate: false,
      hasSession: false,
    })
  }

  get currentSession() {
    if (!this.data) {
      return undefined
    }
    const {did, service} = this.data
    return this.accounts.find(
      account =>
        normalizeUrl(account.service) === normalizeUrl(service) &&
        account.did === did &&
        !!account.accessJwt &&
        !!account.refreshJwt,
    )
  }

  get hasSession() {
    return !!this.currentSession && !!this.rootStore.agent.session
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
      if (hasProp(v, 'data') && activeSession.safeParse(v.data)) {
        this.data = v.data as ActiveSession
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
  }

  /**
   * Attempts to resume the previous session loaded from storage
   */
  async attemptSessionResumption() {
    const sess = this.currentSession
    if (sess) {
      this._log('SessionModel:attemptSessionResumption found stored session')
      this.isResumingSession = true
      try {
        return await this.resumeSession(sess)
      } finally {
        runInAction(() => {
          this.isResumingSession = false
        })
      }
    } else {
      this._log(
        'SessionModel:attemptSessionResumption has no session to resume',
      )
    }
  }

  /**
   * Sets the active session
   */
  async setActiveSession(agent: BskyAgent, did: string) {
    this._log('SessionModel:setActiveSession')
    const hadSession = !!this.data
    this.data = {
      service: agent.service.toString(),
      did,
    }
    await this.rootStore.handleSessionChange(agent, {hadSession})
  }

  /**
   * Upserts a session into the accounts
   */
  persistSession(
    service: string,
    did: string,
    event: AtpSessionEvent,
    session?: AtpSessionData,
    addedInfo?: AdditionalAccountData,
  ) {
    this._log('SessionModel:persistSession', {
      service,
      did,
      event,
      hasSession: !!session,
    })

    const existingAccount = this.accounts.find(
      account => account.service === service && account.did === did,
    )

    // fall back to any preexisting access tokens
    let refreshJwt = session?.refreshJwt || existingAccount?.refreshJwt
    let accessJwt = session?.accessJwt || existingAccount?.accessJwt
    if (event === 'expired') {
      // only clear the tokens when they're known to have expired
      refreshJwt = undefined
      accessJwt = undefined
    }

    const newAccount = {
      service,
      did,
      refreshJwt,
      accessJwt,

      handle: session?.handle || existingAccount?.handle || '',
      email: session?.email || existingAccount?.email || '',
      displayName: addedInfo
        ? addedInfo.displayName
        : existingAccount?.displayName || '',
      aviUrl: addedInfo ? addedInfo.aviUrl : existingAccount?.aviUrl || '',
    }
    if (!existingAccount) {
      this.accounts.push(newAccount)
    } else {
      this.accounts = [
        newAccount,
        ...this.accounts.filter(
          account => !(account.service === service && account.did === did),
        ),
      ]
    }

    // if the session expired, fire an event to let the user know
    if (event === 'expired') {
      this.rootStore.handleSessionDrop()
    }
  }

  /**
   * Clears any session tokens from the accounts; used on logout.
   */
  clearSessionTokens() {
    this._log('SessionModel:clearSessionTokens')
    this.accounts = this.accounts.map(acct => ({
      service: acct.service,
      handle: acct.handle,
      did: acct.did,
      displayName: acct.displayName,
      aviUrl: acct.aviUrl,
    }))
  }

  /**
   * Fetches additional information about an account on load.
   */
  async loadAccountInfo(agent: BskyAgent, did: string) {
    const res = await agent.getProfile({actor: did}).catch(_e => undefined)
    if (res) {
      return {
        displayName: res.data.displayName,
        aviUrl: res.data.avatar,
      }
    }
  }

  /**
   * Helper to fetch the accounts config settings from an account.
   */
  async describeService(service: string): Promise<ServiceDescription> {
    const agent = new BskyAgent({service})
    const res = await agent.com.atproto.server.describeServer({})
    return res.data
  }

  /**
   * Attempt to resume a session that we still have access tokens for.
   */
  async resumeSession(account: AccountData): Promise<boolean> {
    this._log('SessionModel:resumeSession')
    if (!(account.accessJwt && account.refreshJwt && account.service)) {
      this._log(
        'SessionModel:resumeSession aborted due to lack of access tokens',
      )
      return false
    }

    const agent = new BskyAgent({
      service: account.service,
      persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        this.persistSession(account.service, account.did, evt, sess)
      },
    })

    try {
      await networkRetry(3, () =>
        agent.resumeSession({
          accessJwt: account.accessJwt || '',
          refreshJwt: account.refreshJwt || '',
          did: account.did,
          handle: account.handle,
        }),
      )
      const addedInfo = await this.loadAccountInfo(agent, account.did)
      this.persistSession(
        account.service,
        account.did,
        'create',
        agent.session,
        addedInfo,
      )
      this._log('SessionModel:resumeSession succeeded')
    } catch (e: any) {
      this._log('SessionModel:resumeSession failed', {
        error: e.toString(),
      })
      return false
    }

    await this.setActiveSession(agent, account.did)
    return true
  }

  /**
   * Create a new session.
   */
  async login({
    service,
    identifier,
    password,
  }: {
    service: string
    identifier: string
    password: string
  }) {
    this._log('SessionModel:login')
    const agent = new BskyAgent({service})
    await agent.login({identifier, password})
    if (!agent.session) {
      throw new Error('Failed to establish session')
    }

    const did = agent.session.did
    const addedInfo = await this.loadAccountInfo(agent, did)

    this.persistSession(service, did, 'create', agent.session, addedInfo)
    agent.setPersistSessionHandler(
      (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        this.persistSession(service, did, evt, sess)
      },
    )

    await this.setActiveSession(agent, did)
    this._log('SessionModel:login succeeded')
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
    this._log('SessionModel:createAccount')
    const agent = new BskyAgent({service})
    await agent.createAccount({
      handle,
      password,
      email,
      inviteCode,
    })
    if (!agent.session) {
      throw new Error('Failed to establish session')
    }

    const did = agent.session.did
    const addedInfo = await this.loadAccountInfo(agent, did)

    this.persistSession(service, did, 'create', agent.session, addedInfo)
    agent.setPersistSessionHandler(
      (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        this.persistSession(service, did, evt, sess)
      },
    )

    await this.setActiveSession(agent, did)
    this._log('SessionModel:createAccount succeeded')
  }

  /**
   * Close all sessions across all accounts.
   */
  async logout() {
    this._log('SessionModel:logout')
    // TODO
    // need to evaluate why deleting the session has caused errors at times
    // -prf
    /*if (this.hasSession) {
      this.rootStore.agent.com.atproto.session.delete().catch((e: any) => {
        this.rootStore.log.warn(
          '(Minor issue) Failed to delete session on the server',
          e,
        )
      })
    }*/
    this.clearSessionTokens()
    this.rootStore.clearAllSessionState()
  }

  /**
   * Removes an account from the list of stored accounts.
   */
  removeAccount(handle: string) {
    this.accounts = this.accounts.filter(acc => acc.handle !== handle)
  }

  /**
   * Reloads the session from the server. Useful when account details change, like the handle.
   */
  async reloadFromServer() {
    const sess = this.currentSession
    if (!sess) {
      return
    }
    const res = await this.rootStore.agent
      .getProfile({actor: sess.did})
      .catch(_e => undefined)
    if (res?.success) {
      const updated = {
        ...sess,
        handle: res.data.handle,
        displayName: res.data.displayName,
        aviUrl: res.data.avatar,
      }
      runInAction(() => {
        this.accounts = [
          updated,
          ...this.accounts.filter(
            account =>
              !(
                account.service === updated.service &&
                account.did === updated.did
              ),
          ),
        ]
      })
      await this.rootStore.me.load()
    }
  }
}
