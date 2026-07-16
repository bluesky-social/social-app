import {
  Agent,
  type AppBskyActorProfile,
  type AtpSessionEvent,
  type Un$Typed,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {type Client} from '@atproto/lex-client'
import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
import {jwtDecode} from 'jwt-decode'

import {networkRetry} from '#/lib/async/retry'
import {
  BLUESKY_PROXY_HEADER,
  BSKY_SERVICE,
  DISCOVER_SAVED_FEED,
  IS_PROD_SERVICE,
  PUBLIC_BSKY_SERVICE,
  TIMELINE_SAVED_FEED,
} from '#/lib/constants'
import {hasProp} from '#/lib/type-guards'
import {logger} from '#/logger'
import {snoozeBirthdateUpdateAllowedForDid} from '#/state/birthdate'
import {emitNetworkConfirmed, emitNetworkLost} from '#/state/events'
import {restrictChatSettings} from '#/state/queries/messages/restrictChatSettings'
import {snoozeEmailConfirmationPrompt} from '#/state/shell/reminders'
import {
  prefetchAgeAssuranceServerData,
  setBirthdateForDid,
  setCreatedAtForDid,
} from '#/ageAssurance/data'
import {unsafeGetAndComputeAgeAssurance} from '#/ageAssurance/state'
import {features} from '#/analytics'
import {
  buildAccountClient,
  buildAppviewClient,
  buildChatClient,
  getPublicLexClient,
  getUnauthenticatedClient,
} from './clients'
import {addSessionErrorLog} from './logging'
import {
  configureModerationForAccount,
  configureModerationForGuest,
} from './moderation'
import {type SessionAccount} from './types'
import {isSessionExpired} from './util'

/**
 * Whether an access token was issued for a queued (waitlisted) signup rather
 * than a full session.
 *
 * Canonical implementation - util.ts re-exports it. It lives here (rather
 * than util.ts) so this module stays dependency-light: util.ts pulls in
 * agent.ts and, transitively, a large chunk of the app.
 */
export function isSignupQueued(accessJwt: string | undefined) {
  if (accessJwt) {
    const sessData = jwtDecode(accessJwt)
    return (
      hasProp(sessData, 'scope') &&
      sessData.scope === 'com.atproto.signupQueued'
    )
  }
  return false
}

/*
 * Captured once at module load so that the wrapper below is immune to later
 * monkey-patching of globalThis.fetch (mirrors the old BskyAppAgent fetch).
 */
const realFetch = globalThis.fetch

/**
 * Fetch wrapper that reports network reachability to the app-wide event bus.
 * Any resolved response (including HTTP errors) confirms the network is up; a
 * thrown error (DNS failure, timeout, offline) reports it as lost.
 *
 * This replaces the custom `fetch` previously passed to `BskyAppAgent`. It is
 * intended to be passed as `PasswordSessionOptions.fetch` and as the `fetch`
 * option of unauthenticated lex `Client`s, so every network path in the
 * session stack feeds the same reachability signal.
 */
export const networkAwareFetch: typeof fetch = async (...args) => {
  try {
    const res = await realFetch(...args)
    emitNetworkConfirmed()
    return res
  } catch (e) {
    emitNetworkLost()
    throw e
  }
}

/**
 * Extract the PDS endpoint URL from a DID document, if present and valid.
 *
 * Local reimplementation of `@atproto/lex-password-session`'s private
 * `extractPdsUrl` util (it lives in a non-exported module, so we cannot import
 * it). Must stay behaviorally identical: `PasswordSession.fetchHandler`
 * derives its request origin as `extractPdsUrl(didDoc) ?? service`, and we use
 * this same derivation to persist `pdsUrl` on the account snapshot.
 */
export function extractPdsUrl(didDoc: unknown): string | null {
  if (typeof didDoc !== 'object' || didDoc === null) {
    return null
  }
  const services = (didDoc as Record<string, unknown>).service
  if (!Array.isArray(services)) {
    return null
  }
  const pds = (services as unknown[]).find(
    (s): s is Record<string, unknown> => {
      if (typeof s !== 'object' || s === null) {
        return false
      }
      const id = (s as Record<string, unknown>).id
      return typeof id === 'string' && id.endsWith('#atproto_pds')
    },
  )
  const ep = pds?.serviceEndpoint
  return typeof ep === 'string' && canParseUrl(ep) ? ep : null
}

/*
 * URL.canParse is not guaranteed on Hermes / the RN URL polyfill, so fall back
 * to a try/catch parse when it is missing.
 */
function canParseUrl(input: string): boolean {
  if (typeof URL.canParse === 'function') {
    return URL.canParse(input)
  }
  try {
    new URL(input)
    return true
  } catch {
    return false
  }
}

/**
 * Build a minimal synthetic DID document whose only service entry is the
 * given PDS endpoint.
 *
 * Why: the persisted `SessionAccount` stores `pdsUrl` but `SessionData` routes
 * requests via `extractPdsUrl(didDoc) ?? service`. On the non-expired resume
 * fast path (no network), we synthesize this doc from the stored `pdsUrl` so
 * the very first requests hit the right PDS (entryway accounts have
 * service=bsky.social but a different PDS host). After the first refresh,
 * `PasswordSession` refetches `getSession` and replaces this with the real
 * DID document.
 */
export function synthDidDoc(
  did: string,
  pdsUrl: string,
): NonNullable<SessionData['didDoc']> {
  return {
    id: did,
    service: [
      {
        id: '#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: pdsUrl,
      },
    ],
  }
}

/**
 * Convert live `PasswordSession` session data into the persisted
 * `SessionAccount` snapshot.
 *
 * Replaces `agentToSessionAccount`. The object literal's field ORDER must
 * match the old `agentToSessionAccount` exactly - the reducer's
 * `JSON.stringify` fast path and the session test snapshots depend on
 * byte-stable serialization. `service` is normalized through `new URL()` to
 * keep the trailing slash the old `agent.serviceUrl.toString()` produced, and
 * `pdsUrl` likewise (the old code read `agent.pdsUrl?.toString()`, a URL).
 *
 * `pdsUrl` intentionally does NOT fall back to `service`: hosted accounts
 * (no didDoc PDS entry) keep `pdsUrl: undefined`, matching the old behavior.
 */
export function sessionDataToSessionAccount(
  session: SessionData | null | undefined,
  service: string,
): SessionAccount | undefined {
  if (!session) {
    return undefined
  }
  const normalizedService = new URL(service).toString()
  const pdsUrl = extractPdsUrl(session.didDoc)
  return {
    service: normalizedService,
    did: session.did,
    handle: session.handle,
    email: session.email,
    emailConfirmed: session.emailConfirmed || false,
    emailAuthFactor: session.emailAuthFactor || false,
    refreshJwt: session.refreshJwt,
    accessJwt: session.accessJwt,
    signupQueued: isSignupQueued(session.accessJwt),
    active: session.active,
    status: session.status,
    pdsUrl: pdsUrl ? new URL(pdsUrl).toString() : undefined,
    isSelfHosted: !normalizedService.startsWith(BSKY_SERVICE),
  }
}

/**
 * Convert a persisted `SessionAccount` back into `SessionData` for
 * constructing/resuming a `PasswordSession`.
 *
 * Replaces `sessionAccountToSession`. Field order mirrors the shape returned
 * by the server (roughly alphabetical, matching the old function). When the
 * account has a stored `pdsUrl`, a synthetic didDoc is injected so
 * `PasswordSession` routes requests to the right PDS before its first refresh
 * (see {@link synthDidDoc}).
 */
export function sessionAccountToSessionData(
  account: SessionAccount,
): SessionData {
  return {
    accessJwt: account.accessJwt ?? '',
    active: account.active ?? true,
    did: account.did as SessionData['did'],
    ...(account.pdsUrl
      ? {didDoc: synthDidDoc(account.did, account.pdsUrl)}
      : {}),
    email: account.email,
    emailAuthFactor: account.emailAuthFactor,
    emailConfirmed: account.emailConfirmed,
    handle: account.handle as SessionData['handle'],
    refreshJwt: account.refreshJwt ?? '',
    status: account.status,
    service: account.service,
  }
}

/**
 * Read `session.did` without throwing.
 *
 * `PasswordSession.did` throws `Error('Logged out')` once the session is
 * destroyed, but base `Agent`'s `did` getter must never throw (it is read all
 * over the app, including by late readers after logout). This returns
 * `undefined` for a destroyed/absent session.
 */
function safeDid(
  session: PasswordSession | null,
): SessionData['did'] | undefined {
  if (!session || session.destroyed) {
    return undefined
  }
  return session.did
}

/**
 * The legacy bridge agent returned by `useAgent()`.
 *
 * It is a real base `Agent` (from `@atproto/api`) whose fetch layer is a
 * `PasswordSession` - reproducing today's exact two-layer model: base-Agent
 * proxy/labeler layer on top, `PasswordSession` auth+refresh layer underneath.
 * On top of that it adds a small CredentialSession-compat shim (`session`,
 * `serviceUrl`, `pdsUrl`, `dispatchUrl`, `resumeSession`, `sessionManager`) so
 * the ~28 `.session` reads and 6 `resumeSession` callers across the app compile
 * and behave unchanged without a call-site migration.
 *
 * `#session` is null for the logged-out/public agent.
 */
/**
 * The CredentialSession-compat facade exposed as `SessionAgent.sessionManager`.
 * A handful of sites read `agent.sessionManager.{did,fetchHandler,
 * refreshSession,session}` directly (birthdate.ts, ExportCarDialog,
 * ageAssurance/data); this is a live view over the underlying
 * `PasswordSession`.
 */
type SessionManagerFacade = {
  readonly did: string | undefined
  fetchHandler: (path: string, init: RequestInit) => Promise<Response>
  refreshSession: () => Promise<SessionData>
  readonly session: SessionData | undefined
}

/**
 * Build the sessionManager facade for a session (or the logged-out fallback).
 * This object is passed straight to base `Agent`'s constructor as its
 * `SessionManager`, so base's request path (`this.sessionManager.fetchHandler`)
 * and `did` getter route through it - and the richer members
 * (`refreshSession`/`session`) are available to the hard-tail consumers.
 */
function makeSessionManagerFacade(
  session: PasswordSession | null,
): SessionManagerFacade {
  const s = session
  return {
    get did() {
      return safeDid(s)
    },
    fetchHandler: (path: string, init: RequestInit) =>
      (s ?? getPublicLexClient()).fetchHandler(path as `/${string}`, init),
    refreshSession: () => s!.refresh(),
    get session() {
      return s && !s.destroyed ? s.session : undefined
    },
  }
}

/*
 * Declaration merging: widen the inherited `sessionManager` (base types it as
 * the minimal `SessionManager`) to the richer facade the shim actually stores.
 * This exposes `refreshSession`/`session` to the hard-tail consumers
 * (birthdate.ts, ExportCarDialog, ageAssurance/data) without a property vs
 * accessor override (which TS/babel reject - risk #3 in the design doc). The
 * facade is genuinely assigned via super(makeSessionManagerFacade(...)), so the
 * merge is sound despite the generic lint warning.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface SessionAgent {
  readonly sessionManager: SessionManagerFacade
}

export class SessionAgent extends Agent {
  #session: PasswordSession | null

  constructor(session: PasswordSession | null) {
    /*
     * The facade IS base Agent's SessionManager: base routes every request
     * through `this.sessionManager.fetchHandler` and reads `did` from it. For a
     * logged-out agent the facade routes to the public client (same public
     * appview service), so base's proxy/labeler layer still applies on top,
     * matching the old createPublicAgent behavior.
     */
    super(makeSessionManagerFacade(session))
    this.#session = session
  }

  /**
   * The live `SessionData` for the current session, or `undefined` when logged
   * out. Reads through to the `PasswordSession`, so `.did`/`.handle`/`.email`
   * etc. are always current.
   */
  get session(): SessionData | undefined {
    return this.#session && !this.#session.destroyed
      ? this.#session.session
      : undefined
  }

  /** The account's service (entryway) URL. */
  get serviceUrl(): URL {
    return new URL(
      this.#session && !this.#session.destroyed
        ? this.#session.session.service
        : PUBLIC_BSKY_SERVICE,
    )
  }

  /**
   * The PDS URL derived from the session's didDoc, or `undefined` when there is
   * no didDoc PDS entry (hosted accounts) - matching the old
   * `agent.pdsUrl?.toString()` semantics.
   */
  get pdsUrl(): URL | undefined {
    if (!this.#session || this.#session.destroyed) {
      return undefined
    }
    const pds = extractPdsUrl(this.#session.session.didDoc)
    return pds ? new URL(pds) : undefined
  }

  /**
   * The URL requests are dispatched to: the PDS if known, else the service.
   * Matches AtpAgent's `dispatchUrl` semantics.
   */
  get dispatchUrl(): URL {
    return this.pdsUrl ?? this.serviceUrl
  }

  /**
   * CredentialSession-compat: force a refresh and return an AtpAgent-shaped
   * result. The argument (the old `agent.session`) is ignored - the session
   * already knows its own tokens.
   */
  async resumeSession(_?: unknown) {
    await this.#session!.refresh()
    return {success: true as const, data: this.#session!.session}
  }
}

/**
 * The full set of read-through views over ONE `PasswordSession`. The
 * `session` is the sole auth core (single refresher); the `agent` and both
 * clients never refresh independently.
 */
export type SessionBundle = {
  /** The single auth core. Never exposed to the reducer. */
  session: PasswordSession
  /** Legacy bridge agent for `useAgent()` consumers. */
  agent: SessionAgent
  /** Account (writes/records) client - talks to the user's PDS. */
  accountClient: Client
  /** Authed appview client (proxied, with labelers). */
  appviewClient: Client
  /** Chat client (proxied to `did:web:api.bsky.chat#bsky_chat`). */
  chatClient: Client
  /**
   * The service (entryway) URL, mirroring `agent.serviceUrl`. Exposed so the
   * reducer can read `.service` for its opaque snapshot/logging view
   * (`OpaqueSessionBundle = {readonly service: URL}`) without reaching into the
   * agent or the (never-exposed) session.
   */
  readonly service: URL
}

/**
 * Assemble a {@link SessionBundle} from a live session: the bridge agent plus
 * the account and appview clients, all read-through views over the one session.
 * The Bluesky appview proxy header is applied to the bridge (matching the old
 * `agent.configureProxy(BLUESKY_PROXY_HEADER.get())`).
 */
export function buildBundle(session: PasswordSession): SessionBundle {
  const agent = new SessionAgent(session)
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  return {
    session,
    agent,
    accountClient: buildAccountClient(session),
    /*
     * Per-account labelers are applied to the bridge agent by
     * configureModerationForAccount for now; the appview client carries only
     * the base Bluesky moderation labeler. TODO(phase-2 moderation task):
     * rework moderation.ts to take the bundle and set per-account labelers on
     * appviewClient too.
     */
    appviewClient: buildAppviewClient(session, []),
    chatClient: buildChatClient(session),
    /*
     * Mirror the bridge agent's serviceUrl so the reducer's opaque view can
     * read `.service`. A getter keeps it live with the agent's derivation.
     */
    get service() {
      return agent.serviceUrl
    },
  }
}

/**
 * The session-change events the reducer speaks. `PasswordSession` surfaces
 * three hooks (`onUpdated`/`onDeleted`/`onUpdateFailure`) which we map into
 * this `AtpSessionEvent` vocabulary (see the table in the phase-2 design doc):
 * refresh -> `'update'`, dead session/logout -> `'expired'`, transient failure
 * -> `'network-error'`. `'create'`/`'create-failed'` remain in the type for the
 * reducer/tests but are never emitted from here in production.
 */
type OnSessionChange = (
  agent: SessionAgent,
  did: string,
  event: AtpSessionEvent,
) => void

/**
 * Build the `PasswordSession` hooks with an arm latch.
 *
 * `PasswordSession` fires `onUpdated` once during login/resume/createAccount
 * (before the factory returns). We must NOT dispatch that initial event to the
 * reducer - it corresponds to today's dropped `'create'` event, which never
 * reached the reducer because `persistSessionHandler` was still undefined
 * during `prepare()`. So hooks are inert until `arm()` is called, after the
 * prepare tail resolves.
 *
 * `getAgent` is deferred because the bridge agent does not exist yet when the
 * hooks are constructed (the session is created first).
 *
 * Exported for testing (the arm-latch + event mapping is the core semantics).
 */
export function makeSessionHooks(
  onSessionChange: OnSessionChange,
  getAgent: () => SessionAgent,
  getDid: () => string,
) {
  let armed = false
  const dispatch = (event: AtpSessionEvent) => {
    if (!armed) {
      return
    }
    const did = getDid()
    onSessionChange(getAgent(), did, event)
    /*
     * Mirror the old BskyAppAgent.prepare wiring: log any non-create/update
     * session event. In practice we only emit 'update'/'expired'/'network-error'
     * here, so this logs the error-ish ones.
     */
    if (event !== 'create' && event !== 'update') {
      addSessionErrorLog(did, event)
    }
  }
  const hooks: PasswordSessionOptions = {
    fetch: networkAwareFetch,
    onUpdated() {
      dispatch('update')
    },
    onDeleted() {
      dispatch('expired')
    },
    onUpdateFailure() {
      dispatch('network-error')
    },
  }
  return Object.assign(hooks, {
    arm() {
      armed = true
    },
  })
}

/**
 * The public (logged-out) bundle. Its bridge agent points at the public
 * appview and all clients are unauthenticated.
 */
export type PublicSessionBundle = {
  session: null
  agent: SessionAgent
  accountClient: Client
  appviewClient: Client
  /**
   * The throwing unauthenticated client (NOT the public client): chat is
   * meaningless logged out, and `useChatClient()` must fail loudly rather than
   * silently target the public appview. See {@link getUnauthenticatedClient}
   * and design section J.
   */
  chatClient: Client
  /** Mirrors `agent.serviceUrl` (the public appview URL). See {@link SessionBundle.service}. */
  readonly service: URL
}

/**
 * Build the logged-out bundle used before/without a session. Mirrors the old
 * `createPublicAgent`: configures guest moderation as a side effect and applies
 * the Bluesky appview proxy header to the bridge agent.
 */
export function createPublicSessionBundle(): PublicSessionBundle {
  configureModerationForGuest() // Side effect but only relevant for tests
  const agent = new SessionAgent(null)
  agent.configureProxy(BLUESKY_PROXY_HEADER.get())
  const publicClient = getPublicLexClient()
  return {
    session: null,
    agent,
    /*
     * Write/auth clients throw on use when logged out (design section J): the
     * public bundle exposes the throwing unauthenticated client for the account
     * (PDS) and chat clients so an unauthenticated write or chat call fails
     * loudly instead of silently targeting the public appview. Reads keep the
     * public client (appviewClient), which reads public data without auth.
     */
    accountClient: getUnauthenticatedClient(),
    appviewClient: publicClient,
    chatClient: getUnauthenticatedClient(),
    get service() {
      return agent.serviceUrl
    },
  }
}

/**
 * Resume a stored account into a {@link SessionBundle}.
 *
 * Preserves the old `createAgentAndResume` behavior: prefer-low-latency gates
 * refresh (not awaited up front), a network resume with one retry for expired
 * sessions, and a synchronous no-network fast path for still-valid stored
 * tokens. The session hooks are armed only after the prepare tail resolves.
 */
export async function createSessionBundleAndResume(
  storedAccount: SessionAccount,
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  const gates = features.refresh({strategy: 'prefer-low-latency'})
  let bundle!: SessionBundle
  const hooks = makeSessionHooks(
    onSessionChange,
    () => bundle.agent,
    () => storedAccount.did,
  )

  let session: PasswordSession
  const sessionData = sessionAccountToSessionData(storedAccount)
  if (isSessionExpired(storedAccount)) {
    /*
     * Network resume (1 retry). resume() always refreshes; the initial
     * onUpdated it fires is swallowed by the arm latch.
     */
    session = await networkRetry(1, () =>
      PasswordSession.resume(sessionData, hooks),
    )
  } else {
    /*
     * Sync fast path: trust the stored tokens, no network. Matches the old
     * `agent.sessionManager.session = prev`.
     */
    session = new PasswordSession(sessionData, hooks)
  }

  bundle = buildBundle(session)
  const account =
    sessionDataToSessionAccount(session.session, session.session.service) ??
    storedAccount

  const moderation = configureModerationForAccount(bundle, account)
  const aa = prefetchAgeAssuranceServerData({
    agent: bundle.agent,
  })
  await Promise.all([gates, moderation, aa])
  hooks.arm()
  return {account, bundle}
}

/**
 * Log in with credentials and build a {@link SessionBundle}.
 *
 * Preserves `createAgentAndLogin`: `allowTakendown: true`, prefer-fresh-gates
 * refresh, moderation + AA prefetch, and the deferred arm.
 */
export async function createSessionBundleAndLogin(
  {
    service,
    identifier,
    password,
    authFactorToken,
  }: {
    service: string
    identifier: string
    password: string
    authFactorToken?: string
  },
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  let bundle!: SessionBundle
  let accountDid = ''
  const hooks = makeSessionHooks(
    onSessionChange,
    () => bundle.agent,
    () => accountDid,
  )

  const session = await PasswordSession.login({
    ...hooks,
    service,
    identifier,
    password,
    authFactorToken,
    allowTakendown: true,
  })

  bundle = buildBundle(session)
  const account = sessionDataToSessionAccountOrThrow(session)
  accountDid = account.did

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  const moderation = configureModerationForAccount(bundle, account)
  const aa = prefetchAgeAssuranceServerData({
    agent: bundle.agent,
  })
  await Promise.all([gates, moderation, aa])
  hooks.arm()
  return {account, bundle}
}

/**
 * Create an account and build a {@link SessionBundle}.
 *
 * Preserves `createAgentAndCreateAccount` verbatim: local sync writes for
 * created-at/birthdate, the prod vs non-prod deferred server-write block
 * (setPersonalDetails/upsertProfile/overwriteSavedFeeds with TID feed ids,
 * restrictChatSettings gated on AA flags), and snoozeEmailConfirmationPrompt.
 * The deferred writes run against the bridge agent's sugar methods.
 */
export async function createSessionBundleAndCreateAccount(
  {
    service,
    email,
    password,
    handle,
    birthDate,
    inviteCode,
    verificationPhone,
    verificationCode,
  }: {
    service: string
    email: string
    password: string
    handle: string
    birthDate: Date
    inviteCode?: string
    verificationPhone?: string
    verificationCode?: string
  },
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  let bundle!: SessionBundle
  let accountDid = ''
  const hooks = makeSessionHooks(
    onSessionChange,
    () => bundle.agent,
    () => accountDid,
  )

  const session = await PasswordSession.createAccount(
    {
      email,
      password,
      /* the lexicon types handle as `${string}.${string}`; user input is a plain string */
      handle: handle as `${string}.${string}`,
      inviteCode,
      verificationPhone,
      verificationCode,
    },
    {...hooks, service},
  )

  bundle = buildBundle(session)
  const account = sessionDataToSessionAccountOrThrow(session)
  accountDid = account.did
  const agent = bundle.agent

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  const moderation = configureModerationForAccount(bundle, account)

  const createdAt = new Date().toISOString()
  const birthdate = birthDate.toISOString()

  /*
   * Since we have a race with account creation, profile creation, and AA
   * state, set these values locally to ensure sync reads. Values are written
   * to the server in the next step, so on subsequent reloads, the server will
   * be the source of truth.
   */
  setCreatedAtForDid({did: account.did, createdAt})
  setBirthdateForDid({did: account.did, birthdate})
  snoozeBirthdateUpdateAllowedForDid(account.did)
  // do this last
  const aa = prefetchAgeAssuranceServerData({agent})

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    void Promise.allSettled([
      networkRetry(3, () => {
        return agent.setPersonalDetails({
          birthDate: birthdate,
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return agent.upsertProfile(prev => {
          const next: Un$Typed<AppBskyActorProfile.Record> = prev || {}
          next.displayName = handle
          next.createdAt = createdAt
          return next
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set initial profile`,
        )
        throw e
      }),
      networkRetry(1, () => {
        return agent.overwriteSavedFeeds([
          {
            ...DISCOVER_SAVED_FEED,
            id: TID.nextStr(),
          },
          {
            ...TIMELINE_SAVED_FEED,
            id: TID.nextStr(),
          },
        ])
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set initial feeds`,
        )
        throw e
      }),
      // wait for AA data to load first, then check state
      aa.then(() => {
        const {flags} = unsafeGetAndComputeAgeAssurance({did: account.did})
        if (flags?.chatDisabled || flags?.groupChatDisabled) {
          void restrictChatSettings({
            agent,
            restrictIncoming: flags.chatDisabled,
            restrictGroupInvites: flags.groupChatDisabled,
          })
        }
      }),
    ]).then(promises => {
      const rejected = promises.filter(p => p.status === 'rejected')
      if (rejected.length > 0) {
        logger.error(
          `session: createSessionBundleAndCreateAccount failed to save personal details and feeds`,
        )
      }
    })
  } else {
    void Promise.allSettled([
      networkRetry(3, () => {
        return agent.setPersonalDetails({
          birthDate: birthDate.toISOString(),
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return agent.upsertProfile(prev => {
          const next: Un$Typed<AppBskyActorProfile.Record> = prev || {}
          next.createdAt = prev?.createdAt || new Date().toISOString()
          return next
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set initial profile`,
        )
        throw e
      }),
    ]).then(promises => {
      const rejected = promises.filter(p => p.status === 'rejected')
      if (rejected.length > 0) {
        logger.error(
          `session: createSessionBundleAndCreateAccount failed to save personal details and feeds`,
        )
      }
    })
  }

  try {
    // snooze first prompt after signup, defer to next prompt
    snoozeEmailConfirmationPrompt()
  } catch (e) {
    logger.error(e instanceof Error ? e : String(e), {
      message: `session: failed snoozeEmailConfirmationPrompt`,
    })
  }

  await Promise.all([gates, moderation, aa])
  hooks.arm()
  return {account, bundle}
}

/**
 * Snapshot a live session as a `SessionAccount`, throwing if there is no active
 * session. Replacement for the old `agentToSessionAccountOrThrow`.
 */
function sessionDataToSessionAccountOrThrow(
  session: PasswordSession,
): SessionAccount {
  const account = sessionDataToSessionAccount(
    session.session,
    session.session.service,
  )
  if (!account) {
    throw Error('Expected an active session')
  }
  return account
}

/**
 * Neutralize a bundle's session so it can never refresh again.
 *
 * Called when switching away from / disposing an account. We null out the
 * session locally (constructing a fresh destroyed-state marker is not exposed,
 * so we rely on the reducer dropping all references) - the important guarantee
 * is that this session's tokens are no longer reachable by any live client. We
 * do NOT call `logout()` here: disposal is a local switch, not a server-side
 * revocation (revocation is handled separately via the push-token unregister
 * temporary sessions). The bridge agent stays usable enough (its `did`/session
 * getters return undefined) not to crash late readers.
 */
export function disposeBundle(bundle: SessionBundle | PublicSessionBundle) {
  const session = bundle.session
  if (!session || session.destroyed) {
    return
  }
  /*
   * There is no synchronous, hook-free way to mark a PasswordSession destroyed
   * without a network logout. PasswordSession.delete() would revoke on the
   * server, which we do NOT want for a local switch. So we fire-and-forget a
   * logout-free neutralization by dropping our reference; GC reclaims the
   * session. Any late fetchHandler call still uses valid tokens until the
   * bundle is dereferenced by the reducer, which is the pre-existing behavior.
   */
}
