import {makeAutoObservable} from 'mobx'
import {
  AtpAgent,
  AtpSessionEvent,
  AtpSessionData,
  ComAtprotoServerGetAccountsConfig as GetAccountsConfig,
} from '@atproto/api'
import normalizeUrl from 'normalize-url'
import {isObj, hasProp} from 'lib/type-guards'
import {z} from 'zod'
import {RootStoreModel} from './root-store'

export type ServiceDescription = GetAccountsConfig.OutputSchema

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
  displayName: z.string().optional(),
  aviUrl: z.string().optional(),
})
export type AccountData = z.infer<typeof accountData>

interface AdditionalAccountData {
  displayName?: string
  aviUrl?: string
}

export class SessionModel {
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
      this.rootStore.log.debug(
        'SessionModel:attemptSessionResumption found stored session',
      )
      this.isResumingSession = true
      try {
        return await this.resumeSession(sess)
      } finally {
        this.isResumingSession = false
      }
    } else {
      this.rootStore.log.debug(
        'SessionModel:attemptSessionResumption has no session to resume',
      )
    }
  }

  /**
   * Sets the active session
   */
  setActiveSession(agent: AtpAgent, did: string) {
    this.rootStore.log.debug('SessionModel:setActiveSession')
    this.data = {
      service: agent.service.toString(),
      did,
    }
    this.rootStore.handleSessionChange(agent)
  }

  /**
   * Upserts a session into the accounts
   */
  private persistSession(
    service: string,
    did: string,
    event: AtpSessionEvent,
    session?: AtpSessionData,
    addedInfo?: AdditionalAccountData,
  ) {
    this.rootStore.log.debug('SessionModel:persistSession', {
      service,
      did,
      event,
      hasSession: !!session,
    })

    // upsert the account in our listing
    const existingAccount = this.accounts.find(
      account => account.service === service && account.did === did,
    )
    const newAccount = {
      service,
      did,
      refreshJwt: session?.refreshJwt,
      accessJwt: session?.accessJwt,
      handle: session?.handle || existingAccount?.handle || '',
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
  private clearSessionTokens() {
    this.rootStore.log.debug('SessionModel:clearSessionTokens')
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
  private async loadAccountInfo(agent: AtpAgent, did: string) {
    const res = await agent.api.app.bsky.actor
      .getProfile({actor: did})
      .catch(_e => undefined)
    if (res) {
      return {
        dispayName: res.data.displayName,
        aviUrl: res.data.avatar,
      }
    }
  }

  /**
   * Helper to fetch the accounts config settings from an account.
   */
  async describeService(service: string): Promise<ServiceDescription> {
    const agent = new AtpAgent({service})
    const res = await agent.api.com.atproto.server.getAccountsConfig({})
    return res.data
  }

  /**
   * Attempt to resume a session that we still have access tokens for.
   */
  async resumeSession(account: AccountData): Promise<boolean> {
    this.rootStore.log.debug('SessionModel:resumeSession')
    if (!(account.accessJwt && account.refreshJwt && account.service)) {
      this.rootStore.log.debug(
        'SessionModel:resumeSession aborted due to lack of access tokens',
      )
      return false
    }

    const agent = new AtpAgent({
      service: account.service,
      persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        this.persistSession(account.service, account.did, evt, sess)
      },
    })

    try {
      await agent.resumeSession({
        accessJwt: account.accessJwt,
        refreshJwt: account.refreshJwt,
        did: account.did,
        handle: account.handle,
      })
      const addedInfo = await this.loadAccountInfo(agent, account.did)
      this.persistSession(
        account.service,
        account.did,
        'create',
        agent.session,
        addedInfo,
      )
      this.rootStore.log.debug('SessionModel:resumeSession succeeded')
    } catch (e: any) {
      this.rootStore.log.debug('SessionModel:resumeSession failed', {
        error: e.toString(),
      })
      return false
    }

    this.setActiveSession(agent, account.did)
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
    this.rootStore.log.debug('SessionModel:login')
    const agent = new AtpAgent({service})
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

    this.setActiveSession(agent, did)
    this.rootStore.log.debug('SessionModel:login succeeded')
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
    this.rootStore.log.debug('SessionModel:createAccount')
    const agent = new AtpAgent({service})
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

    this.setActiveSession(agent, did)
    this.rootStore.shell.setOnboarding(true)
    this.rootStore.log.debug('SessionModel:createAccount succeeded')
  }

  /**
   * Close all sessions across all accounts.
   */
  async logout() {
    this.rootStore.log.debug('SessionModel:logout')
    // TODO
    // need to evaluate why deleting the session has caused errors at times
    // -prf
    /*if (this.hasSession) {
      this.rootStore.api.com.atproto.session.delete().catch((e: any) => {
        this.rootStore.log.warn(
          '(Minor issue) Failed to delete session on the server',
          e,
        )
      })
    }*/
    this.clearSessionTokens()
    this.rootStore.clearAllSessionState()
  }
}
