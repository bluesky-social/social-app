import {
  AtpAgent,
  type AtpAgentLoginOpts,
  type AtpSessionData,
  type ComAtprotoServerCreateAccount,
  type ComAtprotoServerCreateSession,
  type ComAtprotoServerRefreshSession,
  CredentialSession,
} from '@atproto/api'
import {
  type PasswordSession,
  type SessionData,
} from '@atproto/lex-password-session'

import {BLUESKY_PROXY_HEADER, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {configureModerationForGuest} from './moderation'
import {networkAwareFetch} from './network'

const UNSUPPORTED =
  'Not supported on PasswordSessionManager; use the session factories in session-core'

/**
 * Convert live `PasswordSession` session data into the `AtpSessionData` shape
 * that `CredentialSession.session` consumers expect.
 *
 * The only real adaptation is `active`: `AtpSessionData` requires it, while the
 * lexicon payload leaves it optional (absent means active, per the lexicon
 * docs).
 */
function toAtpSessionData(d: SessionData): AtpSessionData {
  return {
    refreshJwt: d.refreshJwt,
    accessJwt: d.accessJwt,
    handle: d.handle,
    did: d.did,
    email: d.email,
    emailConfirmed: d.emailConfirmed,
    emailAuthFactor: d.emailAuthFactor,
    active: d.active ?? true,
    status: d.status,
  }
}

/**
 * Parse a URL without throwing.
 */
function parseUrl(input: string): URL | undefined {
  try {
    return new URL(input)
  } catch {
    return undefined
  }
}

/**
 * Read a property off an unknown value the way JS optional chaining would,
 * without narrowing assumptions about the shape of a `LexMap`.
 */
function prop(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined
}

/**
 * The PDS endpoint declared by a DID document, or `undefined`.
 *
 * This deliberately mirrors `extractPdsUrl` in `@atproto/lex-password-session`,
 * which is the predicate `PasswordSession` uses to route its own requests: the
 * first service entry whose `id` ends with `#atproto_pds`, taking its
 * `serviceEndpoint` if it parses as a URL. It is looser than the
 * `isValidDidDoc` + `getPdsEndpoint` pair from `@atproto/common-web` (no doc
 * schema validation, no `type` check), and that is the point - a stricter
 * predicate here would let `dispatchUrl` disagree with the host requests
 * actually go to, which in turn mints service-auth tokens (video upload) for
 * the wrong audience.
 */
function extractPdsUrl(didDoc: SessionData['didDoc']): URL | undefined {
  const services = prop(didDoc, 'service')
  if (!Array.isArray(services)) {
    return undefined
  }
  /*
   * `find`, not a scan: the inner session stops at the first `#atproto_pds`
   * entry and gives up if its endpoint does not parse, rather than falling
   * through to a later entry.
   */
  const pds = services.find(service => {
    const id = prop(service, 'id')
    return typeof id === 'string' && id.endsWith('#atproto_pds')
  })
  const endpoint = prop(pds, 'serviceEndpoint')
  return typeof endpoint === 'string' ? parseUrl(endpoint) : undefined
}

/**
 * A `CredentialSession` whose auth core is a `PasswordSession`.
 *
 * This is the compat shim that lets a `PasswordSession` sit under `AtpAgent`:
 * every call site that reads `agent.session`, `agent.pdsUrl`,
 * `agent.dispatchUrl`, `agent.did` or calls `agent.resumeSession()` keeps
 * working, while the actual tokens, refresh serialization and PDS routing live
 * in the `PasswordSession` underneath.
 *
 * A `null` inner session means "logged out" - the public/guest agent. In that
 * mode requests still go out (unauthenticated) through the inherited `fetch`.
 */
export class PasswordSessionManager extends CredentialSession {
  #inner: PasswordSession | null
  #storedPdsUrl: URL | undefined
  #disposed = false

  /*
   * Identity caches for the two pull-through accessors. Each holds the
   * `SessionData` it was derived from so a repeated read returns the very same
   * object (see the note on identity stability below). Keying on the whole
   * `SessionData` rather than the individual field works because
   * `PasswordSession` replaces the object wholesale on every rotation.
   */
  #sessionSource: SessionData | undefined
  #sessionValue: AtpSessionData | undefined
  #pdsSource: SessionData | undefined
  #pdsValue: URL | undefined

  constructor(
    inner: PasswordSession | null,
    {service, pdsUrl}: {service: string; pdsUrl?: string},
  ) {
    /*
     * `persistSession` is deliberately undefined: the inner `PasswordSession`
     * owns persistence through its own hooks, and none of the inherited methods
     * that would call this handler survive the overrides below.
     */
    super(new URL(service), networkAwareFetch, undefined)

    this.#inner = inner
    this.#storedPdsUrl = pdsUrl ? parseUrl(pdsUrl) : undefined

    /*
     * `session` and `pdsUrl` are pull-through accessors over the inner session
     * rather than mirrored values, installed here with `defineProperty` for two
     * reasons.
     *
     * Why accessors at all: a mirror has to be written on every token rotation,
     * and any missed write silently serves stale tokens. Pulling through cannot
     * drift.
     *
     * Why `defineProperty` and not `get session()` in the class body: the
     * parent declares `session` and `pdsUrl` as *properties*, and TypeScript
     * rejects overriding a property with an accessor (TS2611). Installing them
     * at runtime sidesteps that, and it is safe as long as
     * `CredentialSession`'s emitted constructor does not assign either one
     * (both are declaration-only), so there is nothing to clobber and no
     * ordering hazard.
     *
     * For the same reason this class must NOT redeclare `session`/`pdsUrl` as
     * fields: under `useDefineForClassFields` semantics (target esnext) a field
     * declaration emits an own-property definition that would overwrite these
     * accessors with `undefined`.
     */
    Object.defineProperty(this, 'session', {
      configurable: true,
      get: () => this.#readSession(),
      set: () => {
        throw new Error('PasswordSessionManager.session is read-only')
      },
    })
    Object.defineProperty(this, 'pdsUrl', {
      configurable: true,
      get: () => this.#readPdsUrl(),
      set: () => {
        throw new Error('PasswordSessionManager.pdsUrl is read-only')
      },
    })
  }

  /**
   * The inner session's live data, or `undefined` when there is nothing to read
   * from.
   *
   * `PasswordSession`'s `session`/`did`/`handle` getters *throw* `Logged out`
   * once the session has been destroyed. Every read in this class funnels
   * through here so that failure mode can never escape into the app, which
   * reads `agent.session` from render paths.
   */
  #liveData(): SessionData | undefined {
    if (this.#disposed || !this.#inner || this.#inner.destroyed) {
      return undefined
    }
    return this.#inner.session
  }

  /**
   * The `session` accessor's implementation.
   *
   * Identity-cached on the source `SessionData`: consecutive reads with no
   * intervening token rotation return the same object, and a rotation produces
   * a new one. `CredentialSession` declares `session` as a plain field, so
   * consumers are entitled to treat it as a value whose identity changes only
   * when the session does; this class is read from render paths, and returning
   * a freshly allocated object on every read would break that expectation for
   * any memo, dependency array or reference comparison built on top of it.
   */
  #readSession(): AtpSessionData | undefined {
    const live = this.#liveData()
    if (!live) {
      this.#sessionSource = undefined
      this.#sessionValue = undefined
      return undefined
    }
    if (live !== this.#sessionSource) {
      this.#sessionSource = live
      this.#sessionValue = toAtpSessionData(live)
    }
    return this.#sessionValue
  }

  /**
   * The `pdsUrl` accessor's implementation.
   *
   * The DID document's PDS endpoint wins when there is one, derived with
   * {@link extractPdsUrl} so this agrees exactly with the inner session's own
   * routing. Before the first refresh delivers a didDoc (the non-expired resume
   * fast path, which makes no network call) we fall back to the `pdsUrl`
   * persisted on the account, so the very first requests still reach the right
   * host - entryway accounts have `service: bsky.social` but live on a
   * different PDS.
   *
   * Identity-cached on the didDoc for the same reason as `session`.
   */
  #readPdsUrl(): URL | undefined {
    const live = this.#liveData()
    if (!live) {
      this.#pdsSource = undefined
      this.#pdsValue = undefined
      return undefined
    }
    if (live !== this.#pdsSource) {
      this.#pdsSource = live
      this.#pdsValue = extractPdsUrl(live.didDoc) ?? this.#storedPdsUrl
    }
    return this.#pdsValue
  }

  /*
   * `did`, `hasSession` and `dispatchUrl` are deliberately NOT overridden: the
   * inherited getters read `this.session` / `this.pdsUrl`, which resolve
   * through the accessors above, so they are already live.
   */

  override async fetchHandler(
    url: string,
    init?: RequestInit,
  ): Promise<Response> {
    /*
     * Absolutizing against `dispatchUrl` routes to the stored PDS on the resume
     * fast path and to the didDoc PDS from the first refresh onwards, since
     * `PasswordSession` resolves an already absolute URL against its own base
     * as a no-op.
     */
    const target = new URL(url, this.dispatchUrl)
    const inner = this.#disposed ? null : this.#inner

    /*
     * A caller that set its own `authorization` header bypasses the inner
     * session entirely. This is mandatory: `PasswordSession.fetchHandler`
     * throws `TypeError` on a pre-set authorization header rather than
     * deferring to it.
     *
     * Bypassing also means these requests get no refresh-on-401 retry, since
     * that lives in `PasswordSession.fetchHandler`. That is intentional: the
     * caller supplied its own credential (a service-auth token, say), so
     * rotating the session's tokens would not make the request any more likely
     * to succeed on a retry.
     */
    if (
      !inner ||
      inner.destroyed ||
      new Headers(init?.headers).has('authorization')
    ) {
      return (0, this.fetch)(target, init)
    }

    /*
     * `init ?? {}` because `PasswordSession.fetchHandler` reads `init.headers`
     * unguarded, while the inherited signature makes `init` optional.
     */
    return inner.fetchHandler(target.href, init ?? {})
  }

  /**
   * Refresh the session, rejecting if nothing was refreshed.
   *
   * This restores the contract of the `CredentialSession.refreshSession` this
   * class replaces, which rejected on any refresh failure.
   * `PasswordSession.refresh()` does not: on a transient failure (a 500, a
   * network error) it reports through `onUpdateFailure` and then *resolves*
   * with the unchanged session data, reserving rejection for the cases where
   * the session is definitively gone. Callers here read resolution as "tokens
   * rotated" - `SignupQueued` refreshes and then re-checks the token scope, and
   * the various verification dialogs refresh and then close - so a resolved
   * no-op would silently loop or report success.
   *
   * The signal is the identity of the returned `SessionData`, not a field
   * comparison: `PasswordSession` builds a brand new object on every successful
   * rotation and returns the existing one untouched on a transient failure, so
   * identity separates the two exactly. Comparing against the data captured
   * immediately before the call also gets concurrent refreshes right - if
   * another caller's refresh rotated the tokens while ours was queued behind it
   * (`PasswordSession` serializes refreshes), the data we get back still
   * differs from what we captured, which is a success for our caller.
   */
  override async refreshSession(): Promise<ComAtprotoServerRefreshSession.Response> {
    const inner = this.#disposed ? null : this.#inner
    if (!inner || inner.destroyed) {
      throw new Error('No session to refresh')
    }
    const before = this.#liveData()
    const data = await inner.refresh()
    if (data === before) {
      throw new Error('Failed to refresh session')
    }
    /*
     * Re-shape the lex payload into the `@atproto/api` XRPC response envelope.
     * `headers` is empty because the inner session does not surface response
     * headers, and no caller in this app reads them off a refresh.
     */
    return {
      success: true,
      headers: {},
      data: {
        accessJwt: data.accessJwt,
        refreshJwt: data.refreshJwt,
        handle: data.handle,
        did: data.did,
        didDoc: data.didDoc,
        email: data.email,
        emailConfirmed: data.emailConfirmed,
        emailAuthFactor: data.emailAuthFactor,
        active: data.active,
        status: data.status,
      },
    }
  }

  /**
   * Force a refresh, ignoring the passed-in session data.
   *
   * The inner session already owns its tokens, so there is nothing to install;
   * every call site in the app uses `resumeSession` as "refresh my session
   * now". The returned envelope is the refresh one, which is structurally a
   * superset of `ComAtprotoServerGetSession.Response` (the shape `AtpAgent`
   * advertises), so both layers stay type-correct.
   *
   * It inherits {@link PasswordSessionManager.refreshSession}'s contract, so it
   * rejects rather than resolving when no tokens were rotated.
   */
  override resumeSession(
    _session: AtpSessionData,
  ): Promise<ComAtprotoServerRefreshSession.Response> {
    return this.refreshSession()
  }

  override async logout(): Promise<void> {
    const inner = this.#inner
    if (!inner || inner.destroyed) {
      return
    }
    try {
      await inner.logout()
    } catch {
      /* matches the parent, which swallows delete-session failures */
    }
  }

  override login(
    _opts: AtpAgentLoginOpts,
  ): Promise<ComAtprotoServerCreateSession.Response> {
    return Promise.reject(new Error(UNSUPPORTED))
  }

  override createAccount(
    _data: ComAtprotoServerCreateAccount.InputSchema,
    _opts?: ComAtprotoServerCreateAccount.CallOptions,
  ): Promise<ComAtprotoServerCreateAccount.Response> {
    return Promise.reject(new Error(UNSUPPORTED))
  }

  /**
   * Detach this manager from its inner session.
   *
   * All reads then behave as logged out and requests fall back to the
   * unauthenticated `fetch` path. The inner session is left alone: it may still
   * be shared, and logging out is a separate, explicit operation.
   */
  dispose() {
    this.#disposed = true
  }
}

/*
 * Declaration merging to narrow the inherited `sessionManager` (typed as
 * `CredentialSession` by `AtpAgent`) to the manager `BskyAppAgent` actually
 * receives. A `declare` class field would be the direct way to say this, but
 * babel's TypeScript transform rejects `declare` fields in this config, and a
 * `get sessionManager()` override is forbidden because the parent declares it
 * as a property (TS2611). The merge is sound: the constructor passes the
 * manager straight to `super`, which assigns it.
 */
// eslint-disable-next-line typescript/no-unsafe-declaration-merging
export interface BskyAppAgent {
  readonly sessionManager: PasswordSessionManager
}

/**
 * The app's `AtpAgent`, backed by a `PasswordSession`.
 *
 * Everything interesting lives in {@link PasswordSessionManager}; this exists
 * so `useAgent()` consumers keep getting a real `AtpAgent` (proxy headers,
 * labeler headers, the `app`/`com`/`chat` namespaces) and so the agent can be
 * disposed alongside its session.
 */
export class BskyAppAgent extends AtpAgent {
  constructor(manager: PasswordSessionManager) {
    super(manager)
  }

  dispose() {
    this.sessionManager.dispose()
  }
}

/** Build the logged-out agent used for public/guest browsing. */
export function createPublicAgent() {
  configureModerationForGuest() // Side effect but only relevant for tests

  const agent = new BskyAppAgent(
    new PasswordSessionManager(null, {service: PUBLIC_BSKY_SERVICE}),
  )
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return agent
}
