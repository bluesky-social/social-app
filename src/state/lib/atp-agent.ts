import {
  Client as AtpClient,
  ServiceClient as AtpServiceClient,
  ComAtprotoAccountCreate,
  ComAtprotoSessionCreate,
  ComAtprotoSessionGet,
  ComAtprotoSessionRefresh,
} from '@atproto/api'

const REFRESH_SESSION = 'com.atproto.session.refresh'

/**
 * Types
 * (These will be moved to the types.ts file in the api package)
 */

export type SessionEvent = 'create' | 'create-failed' | 'update' | 'expired'

export interface SessionData {
  refreshJwt: string
  accessJwt: string
  handle: string
  did: string
}

export interface CreateAccountOpts {
  email: string
  password: string
  handle: string
  inviteCode?: string
}

export interface LoginOpts {
  identifier: string
  password: string
}

type FetchHeaders = Record<string, string>
export interface FetchHandlerResponse {
  status: number
  headers: Record<string, string>
  body: any
}
export type FetchHandler = (
  httpUri: string,
  httpMethod: string,
  httpHeaders: FetchHeaders,
  httpReqBody: any,
) => Promise<FetchHandlerResponse>

export interface AtpAgentGlobalOpts {
  fetch: FetchHandler
}

type PersistSessionHandler = (
  evt: SessionEvent,
  session: SessionData | undefined,
) => void | Promise<void>

export interface AtpAgentOpts {
  service: string | URL
  persistSession?: PersistSessionHandler
}

/**
 * An ATP "Agent"
 * Manages session token lifecycles and provides convenience methods.
 */
export class AtpAgent {
  service: URL
  api: AtpServiceClient
  session?: SessionData

  private _persistSession?: PersistSessionHandler
  private _refreshSessionPromise: Promise<void> | undefined

  /**
   * The `fetch` implementation; must be implemented for your platform.
   */
  static fetch: FetchHandler | undefined

  /**
   * Configures the API globally.
   */
  static configure(opts: AtpAgentGlobalOpts) {
    AtpAgent.fetch = opts.fetch
  }

  constructor(opts: AtpAgentOpts) {
    this.service =
      opts.service instanceof URL ? opts.service : new URL(opts.service)
    this._persistSession = opts.persistSession

    // create an ATP client instance for this agent
    const client = new AtpClient()
    client.xrpc.fetch = this._fetch.bind(this) // patch its fetch implementation
    this.api = client.service(opts.service)
  }

  /**
   * Is there any active session?
   */
  get hasSession() {
    return !!this.session
  }

  /**
   * Sets the "Persist Session" method which can be used to store access tokens
   * as they change.
   */
  setPersistSessionHandler(handler?: PersistSessionHandler) {
    this._persistSession = handler
  }

  /**
   * Create a new account and hydrate its session in this agent.
   */
  async createAccount(
    opts: CreateAccountOpts,
  ): Promise<ComAtprotoAccountCreate.Response> {
    try {
      this.session = undefined
      const res = await this.api.com.atproto.account.create({
        handle: opts.handle,
        password: opts.password,
        email: opts.email,
        inviteCode: opts.inviteCode,
      })
      this.session = {
        accessJwt: res.data.accessJwt,
        refreshJwt: res.data.refreshJwt,
        handle: res.data.handle,
        did: res.data.did,
      }
      return res
    } finally {
      if (this.session) {
        this._persistSession?.('create', this.session)
      } else {
        this._persistSession?.('create-failed', undefined)
      }
    }
  }

  /**
   * Start a new session with this agent.
   */
  async login(opts: LoginOpts): Promise<ComAtprotoSessionCreate.Response> {
    try {
      this.session = undefined
      const res = await this.api.com.atproto.session.create({
        identifier: opts.identifier,
        password: opts.password,
      })
      this.session = {
        accessJwt: res.data.accessJwt,
        refreshJwt: res.data.refreshJwt,
        handle: res.data.handle,
        did: res.data.did,
      }
      return res
    } finally {
      if (this.session) {
        this._persistSession?.('create', this.session)
      } else {
        this._persistSession?.('create-failed', undefined)
      }
    }
  }

  /**
   * Resume a pre-existing session with this agent.
   */
  async resumeSession(
    session: SessionData,
  ): Promise<ComAtprotoSessionGet.Response> {
    this.session = session
    try {
      const res = await this.api.com.atproto.session.get()
      if (!res.success || res.data.did !== this.session.did) {
        throw new Error('Invalid session')
      }
      return res
    } catch (e: any) {
      this.session = undefined
      throw e
    } finally {
      if (this.session) {
        this._persistSession?.('create', this.session)
      } else {
        this._persistSession?.('create-failed', undefined)
      }
    }
  }

  /**
   * Internal helper to add authorization headers to requests.
   */
  private _addAuthHeader(reqHeaders: Record<string, string>) {
    if (!reqHeaders.authorization && this.session?.accessJwt) {
      return {
        ...reqHeaders,
        authorization: `Bearer ${this.session.accessJwt}`,
      }
    }
    return reqHeaders
  }

  /**
   * Internal fetch handler which adds access-token management
   */
  private async _fetch(
    reqUri: string,
    reqMethod: string,
    reqHeaders: Record<string, string>,
    reqBody: any,
  ): Promise<FetchHandlerResponse> {
    if (!AtpAgent.fetch) {
      throw new Error('AtpAgent fetch() method not configured')
    }

    // wait for any active session-refreshes to finish
    await this._refreshSessionPromise

    // send the request
    let res = await AtpAgent.fetch(
      reqUri,
      reqMethod,
      this._addAuthHeader(reqHeaders),
      reqBody,
    )

    // handle session-refreshes as needed
    if (isResError(res, ['ExpiredToken']) && this.session?.refreshJwt) {
      // attempt refresh
      await this._refreshSession()

      // resend the request with the new access token
      res = await AtpAgent.fetch(
        reqUri,
        reqMethod,
        this._addAuthHeader(reqHeaders),
        reqBody,
      )
    }

    return res
  }

  /**
   * Internal helper to refresh sessions
   * - Wraps the actual implementation in a promise-guard to ensure only
   *   one refresh is attempted at a time.
   */
  private async _refreshSession() {
    if (this._refreshSessionPromise) {
      return this._refreshSessionPromise
    }
    this._refreshSessionPromise = this._refreshSessionInner()
    await this._refreshSessionPromise
    this._refreshSessionPromise = undefined
  }

  /**
   * Internal helper to refresh sessions (actual behavior)
   */
  private async _refreshSessionInner() {
    if (!AtpAgent.fetch) {
      throw new Error('AtpAgent fetch() method not configured')
    }
    if (!this.session?.refreshJwt) {
      return
    }

    // send the refresh request
    const url = new URL(this.service.origin)
    url.pathname = `/xrpc/${REFRESH_SESSION}`
    const res = await AtpAgent.fetch(
      url.toString(),
      'POST',
      {
        authorization: `Bearer ${this.session.refreshJwt}`,
      },
      undefined,
    )

    if (isResError(res, ['ExpiredToken', 'InvalidToken'])) {
      // failed due to a bad refresh token
      this.session = undefined
      this._persistSession?.('expired', undefined)
    } else if (isNewSessionObject(res.body)) {
      // succeeded, update the session
      this.session = {
        accessJwt: res.body.accessJwt,
        refreshJwt: res.body.refreshJwt,
        handle: res.body.handle,
        did: res.body.did,
      }
      this._persistSession?.('update', this.session)
    }
    // else: other failures should be ignored - the issue will
    // propagate in the _fetch() handler's second attempt to run
    // the request
  }
}

/**
 * These validator helpers will be replaced with existing code
 * once moved into the api package
 */
interface ErrorObject {
  error: string
}

function hasProp<K extends PropertyKey>(
  data: object,
  prop: K,
): data is Record<K, unknown> {
  return prop in data
}

function isErrorObject(v: unknown): v is ErrorObject {
  if (!v) {
    return false
  }
  if (typeof v !== 'object') {
    return false
  }
  if (!hasProp(v, 'error')) {
    return false
  }
  if (typeof v.error !== 'string') {
    return false
  }
  return true
}

function isResError(res: FetchHandlerResponse, errorNames: string[]): boolean {
  if (res.status !== 400) {
    return false
  }
  if (!isErrorObject(res.body)) {
    return false
  }
  return errorNames.includes(res.body.error)
}

function isNewSessionObject(
  v: unknown,
): v is ComAtprotoSessionRefresh.OutputSchema {
  if (!v) {
    return false
  }
  if (typeof v !== 'object') {
    return false
  }
  if (!hasProp(v, 'accessJwt') || typeof v.accessJwt !== 'string') {
    return false
  }
  if (!hasProp(v, 'refreshJwt') || typeof v.refreshJwt !== 'string') {
    return false
  }
  if (!hasProp(v, 'handle') || typeof v.handle !== 'string') {
    return false
  }
  if (!hasProp(v, 'did') || typeof v.did !== 'string') {
    return false
  }
  return true
}
