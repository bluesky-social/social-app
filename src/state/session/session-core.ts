import {TID} from '@atproto/common-web'
import {type Client} from '@atproto/lex'
import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'
import {toDatetimeString} from '@atproto/syntax'
import {
  overwriteSavedFeeds,
  setPersonalDetails,
  upsertProfile,
} from '@bsky.app/sdk'
import {jwtDecode} from 'jwt-decode'

import {networkRetry} from '#/lib/async/retry'
import {
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
import {type app} from '#/lexicons'
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
 * The session-change events the reducer/logging/tests speak. In production only
 * `'update'`/`'expired'`/`'network-error'` are ever emitted from
 * {@link makeSessionHooks}; `'create'`/`'create-failed'` exist only for the
 * reducer and the session tests.
 */
export type AtpSessionEvent =
  | 'create'
  | 'create-failed'
  | 'update'
  | 'expired'
  | 'network-error'

/**
 * Whether an access token was issued for a queued (waitlisted) signup rather
 * than a full session.
 *
 * Canonical implementation - util.ts re-exports it. It lives here (rather than
 * util.ts) so this module stays dependency-light: util.ts transitively pulls in
 * a large chunk of the app.
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
 * Captured once at module load so the wrapper below is immune to later
 * monkey-patching of globalThis.fetch.
 */
const realFetch = globalThis.fetch

/**
 * Fetch wrapper that reports network reachability to the app-wide event bus.
 * Any resolved response (including HTTP errors) confirms the network is up; a
 * thrown error (DNS failure, timeout, offline) reports it as lost.
 *
 * Passed as `PasswordSessionOptions.fetch` and as the `fetch` option of
 * unauthenticated lex `Client`s, so every network path in the session stack
 * feeds the same reachability signal.
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
 * Must stay behaviorally identical to `@atproto/lex-password-session`'s private
 * `extractPdsUrl` (non-exported, so we reimplement it): `PasswordSession.
 * fetchHandler` derives its request origin as `extractPdsUrl(didDoc) ?? service`,
 * and we reuse this derivation to persist `pdsUrl` on the account snapshot.
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
 * Build a minimal synthetic DID document whose only service entry is the given
 * PDS endpoint.
 *
 * The persisted `SessionAccount` stores `pdsUrl` but `SessionData` routes
 * requests via `extractPdsUrl(didDoc) ?? service`. On the non-expired resume
 * fast path (no network) we synthesize this doc from the stored `pdsUrl` so the
 * very first requests hit the right PDS (entryway accounts have
 * service=bsky.social but a different PDS host). After the first refresh,
 * `PasswordSession` refetches `getSession` and replaces it with the real doc.
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
 * The object literal's field ORDER is load-bearing: the reducer's
 * `JSON.stringify` fast path and the session test snapshots depend on
 * byte-stable serialization. `service` and `pdsUrl` are normalized through
 * `new URL().toString()` for a stable trailing slash.
 *
 * `pdsUrl` intentionally does NOT fall back to `service`: hosted accounts (no
 * didDoc PDS entry) keep `pdsUrl: undefined`.
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
 * When the account has a stored `pdsUrl`, a synthetic didDoc is injected so
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
 * The service (entryway) URL for a session, or the public appview URL when
 * logged out / destroyed. Backs the {@link SessionBundle.service} getter.
 */
function deriveServiceUrl(session: PasswordSession | null): URL {
  return new URL(
    session && !session.destroyed
      ? session.session.service
      : PUBLIC_BSKY_SERVICE,
  )
}

/**
 * The full set of read-through views over ONE `PasswordSession`. The
 * `session` is the sole auth core (single refresher); the clients never refresh
 * independently.
 */
export type SessionBundle = {
  /** The single auth core. Never exposed to the reducer. */
  session: PasswordSession
  /** Account (writes/records) client - talks to the user's PDS. */
  accountClient: Client
  /** Authed appview client (proxied, with labelers). */
  appviewClient: Client
  /** Chat client (proxied to `did:web:api.bsky.chat#bsky_chat`). */
  chatClient: Client
  /**
   * The service (entryway) URL. Exposed so the reducer can read `.service` for
   * its opaque snapshot/logging view (`OpaqueSessionBundle = {readonly service:
   * URL}`) without reaching into the (never-exposed) session.
   */
  readonly service: URL
}

/**
 * Kill-switches for live bundles, keyed by bundle identity.
 *
 * `PasswordSession` exposes no local (logout-free) destroy, so disposal is
 * implemented via a closure flag inside the session's injected `fetch` (see
 * {@link makeSessionHooks}). The `kill()` that trips that flag is produced next
 * to the hooks - before the bundle exists - so we stash it here once the bundle
 * is built and look it up in {@link disposeBundle}. A `WeakMap` keeps this off
 * the {@link SessionBundle} type (the reducer's opaque view must not see it) and
 * lets the entry be GC'd with the bundle.
 */
const bundleKillSwitches = new WeakMap<SessionBundle, () => void>()

/**
 * Associate a bundle with the `kill()` from its {@link makeSessionHooks}, so
 * {@link disposeBundle} can neutralize the underlying session. Call once, right
 * after the bundle is built, at every session-construction site.
 */
export function registerBundleKillSwitch(
  bundle: SessionBundle,
  kill: () => void,
) {
  bundleKillSwitches.set(bundle, kill)
}

/**
 * Assemble a {@link SessionBundle} from a live session: the account, appview,
 * and chat clients, all read-through views over the one session.
 */
export function buildBundle(session: PasswordSession): SessionBundle {
  return {
    session,
    accountClient: buildAccountClient(session),
    /*
     * Starts with an empty per-account labeler set; configureModerationForAccount
     * applies this account's labelers afterwards.
     */
    appviewClient: buildAppviewClient(session, []),
    chatClient: buildChatClient(session),
    /* A getter keeps `.service` live with the session's state (destroyed -> public). */
    get service() {
      return deriveServiceUrl(session)
    },
  }
}

/**
 * The session-change callback the provider passes into the hooks.
 *
 * The whole {@link SessionBundle} is handed through so the provider can snapshot
 * the live session and use the bundle itself as the reducer's identity token.
 *
 * `sessionData` is the payload the library hands the hook. It is present on
 * BOTH the `'update'` path (the fresh, rotated session) and the `'expired'`
 * path (the DYING session's data, which `refresh()` passes to `onDeleted`
 * BEFORE it nulls its internal `#sessionData`). It matters because
 * `PasswordSession` fires `onUpdated`/`onDeleted` BEFORE committing
 * `#sessionData` (see `refresh()`/`logout()` in password-session.js), so the
 * live getter (`bundle.session.session`) still returns the OLD tokens at hook
 * time. On `'update'` the provider builds the refreshed account from this
 * argument; on `'expired'` it reads the dying refreshJwt from it to drive the
 * compare-and-rescue at the dispatch site.
 */
type OnSessionChange = (
  bundle: SessionBundle,
  did: string,
  event: AtpSessionEvent,
  sessionData?: SessionData,
) => void

/**
 * Build the `PasswordSession` hooks with an arm latch.
 *
 * `PasswordSession` fires `onUpdated` once during login/resume/createAccount
 * before the factory returns. We must NOT dispatch that initial event, so hooks
 * stay inert until `arm()` is called after the prepare tail resolves.
 *
 * `getBundle` is deferred because the bundle does not exist yet when the hooks
 * are constructed (session first, then bundle built over it).
 *
 * The `fetch` option is wrapped in a kill-switch: `kill()` sets a closure flag
 * so every subsequent request through this session - direct fetches AND the
 * internal auto-refresh, which `PasswordSession` routes through the same
 * captured `options.fetch` - throws instead of hitting the network. `kill()`
 * also disarms the hooks so a disposed session can never dispatch into the
 * reducer. This is the disposal mechanism {@link disposeBundle} relies on
 * (`PasswordSession` exposes no local destroy).
 */
export function makeSessionHooks(
  onSessionChange: OnSessionChange,
  getBundle: () => SessionBundle,
  getDid: () => string,
) {
  let armed = false
  let killed = false
  const dispatch = (event: AtpSessionEvent, sessionData?: SessionData) => {
    if (!armed) {
      return
    }
    const did = getDid()
    onSessionChange(getBundle(), did, event, sessionData)
    // Log the error-ish events ('expired'/'network-error').
    if (event !== 'create' && event !== 'update') {
      addSessionErrorLog(did, event)
    }
  }
  const hooks: PasswordSessionOptions = {
    fetch: (input, init) => {
      if (killed) {
        throw new Error('session disposed')
      }
      return networkAwareFetch(input, init)
    },
    onUpdated(data) {
      dispatch('update', data)
    },
    onDeleted(data) {
      dispatch('expired', data)
    },
    onUpdateFailure() {
      dispatch('network-error')
    },
  }
  return Object.assign(hooks, {
    arm() {
      armed = true
    },
    kill() {
      killed = true
      armed = false
    },
  })
}

/**
 * The public (logged-out) bundle. Its appview client points at the public
 * appview; the write/chat clients are the throwing unauthenticated client.
 */
export type PublicSessionBundle = {
  session: null
  accountClient: Client
  appviewClient: Client
  /**
   * The throwing unauthenticated client (NOT the public client): chat is
   * meaningless logged out, and `useChatClient()` must fail loudly rather than
   * silently target the public appview. See {@link getUnauthenticatedClient}.
   */
  chatClient: Client
  /** The public appview URL. See {@link SessionBundle.service}. */
  readonly service: URL
}

/**
 * Build the logged-out bundle used before/without a session. Configures guest
 * moderation as a side effect.
 */
export function createPublicSessionBundle(): PublicSessionBundle {
  configureModerationForGuest() // Side effect but only relevant for tests
  const publicClient = getPublicLexClient()
  return {
    session: null,
    /*
     * The account (PDS) and chat clients throw on use when logged out, so an
     * unauthenticated write or chat call fails loudly instead of silently
     * targeting the public appview. Reads keep the public client (appviewClient),
     * which reads public data without auth.
     */
    accountClient: getUnauthenticatedClient(),
    appviewClient: publicClient,
    chatClient: getUnauthenticatedClient(),
    service: new URL(PUBLIC_BSKY_SERVICE),
  }
}

/**
 * Resume a stored account into a {@link SessionBundle}. Expired sessions take a
 * network resume (one retry); still-valid stored tokens take a synchronous
 * no-network fast path. Hooks are armed only after the prepare tail resolves.
 */
export async function createSessionBundleAndResume(
  storedAccount: SessionAccount,
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  const gates = features.refresh({strategy: 'prefer-low-latency'})
  let bundle!: SessionBundle
  const hooks = makeSessionHooks(
    onSessionChange,
    () => bundle,
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
    // Sync fast path: trust the stored tokens, no network.
    session = new PasswordSession(sessionData, hooks)
  }

  bundle = buildBundle(session)
  registerBundleKillSwitch(bundle, hooks.kill)
  /*
   * Early snapshot: only used to configure moderation below (its handle/did are
   * refresh-stable). The RETURNED account is re-snapshotted after the prep
   * awaits (see below).
   */
  const earlyAccount =
    sessionDataToSessionAccount(session.session, session.session.service) ??
    storedAccount

  configureModerationForAccount(bundle, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: bundle.appviewClient,
    accountClient: bundle.accountClient,
  })
  await Promise.all([gates, aa])
  /*
   * Re-snapshot AFTER prep, right before arm(). A 401 during a prep request
   * (e.g. the AA prefetch) triggers PasswordSession's internal auto-refresh,
   * which rotates both tokens; its onUpdated is dropped by the still-disarmed
   * latch. Snapshotting here (not before prep) persists the fresh refreshJwt
   * rather than a stale one that is dead on the next cold start.
   */
  const account =
    sessionDataToSessionAccount(session.session, session.session.service) ??
    storedAccount
  hooks.arm()
  return {account, bundle}
}

/**
 * Log in with credentials and build a {@link SessionBundle}.
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
    () => bundle,
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
  registerBundleKillSwitch(bundle, hooks.kill)
  // Early snapshot: needed now to seed `accountDid` (the getDid closure).
  const earlyAccount = sessionDataToSessionAccountOrThrow(session)
  accountDid = earlyAccount.did

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  configureModerationForAccount(bundle, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: bundle.appviewClient,
    accountClient: bundle.accountClient,
  })
  await Promise.all([gates, aa])
  /*
   * Re-snapshot AFTER prep, right before arm(): a 401 during a prep request
   * triggers PasswordSession's internal auto-refresh, which rotates both tokens
   * and fires an onUpdated the disarmed latch drops, so this persists the fresh
   * refreshJwt. If the session was destroyed mid-prep, OrThrow throws (login
   * effectively failed).
   */
  const account = sessionDataToSessionAccountOrThrow(session)
  hooks.arm()
  return {account, bundle}
}

/**
 * Create an account and build a {@link SessionBundle}. Writes created-at and
 * birthdate locally for sync reads, then fires the deferred server-write block
 * (personal details, profile, saved feeds, and AA-gated chat restrictions) as
 * SDK actions against the account (PDS) client.
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
    () => bundle,
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
  registerBundleKillSwitch(bundle, hooks.kill)
  /*
   * Early snapshot: needed now to seed `accountDid` and for the DID/handle used
   * across the local and deferred server writes below (all refresh-stable).
   */
  const earlyAccount = sessionDataToSessionAccountOrThrow(session)
  accountDid = earlyAccount.did

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  configureModerationForAccount(bundle, earlyAccount)

  const createdAt = toDatetimeString(new Date())
  const birthdate = birthDate.toISOString()

  /*
   * Since we have a race with account creation, profile creation, and AA
   * state, set these values locally to ensure sync reads. Values are written
   * to the server in the next step, so on subsequent reloads, the server will
   * be the source of truth.
   */
  setCreatedAtForDid({did: earlyAccount.did, createdAt})
  setBirthdateForDid({did: earlyAccount.did, birthdate})
  snoozeBirthdateUpdateAllowedForDid(earlyAccount.did)
  // do this last
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: bundle.appviewClient,
    accountClient: bundle.accountClient,
  })

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    void Promise.allSettled([
      networkRetry(3, () => {
        return bundle.accountClient.call(setPersonalDetails, {
          birthDate,
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return bundle.accountClient.call(upsertProfile, prev => {
          const next: Partial<app.bsky.actor.profile.Main> = prev || {}
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
        return bundle.accountClient.call(overwriteSavedFeeds, [
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
        const {flags} = unsafeGetAndComputeAgeAssurance({did: earlyAccount.did})
        if (flags?.chatDisabled || flags?.groupChatDisabled) {
          void restrictChatSettings({
            client: bundle.accountClient,
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
        return bundle.accountClient.call(setPersonalDetails, {
          birthDate,
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return bundle.accountClient.call(upsertProfile, prev => {
          const next: Partial<app.bsky.actor.profile.Main> = prev || {}
          next.createdAt = prev?.createdAt || toDatetimeString(new Date())
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

  await Promise.all([gates, aa])
  /*
   * Re-snapshot AFTER prep, right before arm(): a 401 during a prep request
   * triggers PasswordSession's internal auto-refresh, which rotates both tokens
   * and fires an onUpdated the disarmed latch drops, so this persists the fresh
   * refreshJwt. If the session was destroyed mid-prep, OrThrow throws.
   */
  const account = sessionDataToSessionAccountOrThrow(session)
  hooks.arm()
  return {account, bundle}
}

/**
 * Snapshot a live session as a `SessionAccount`, throwing if there is no active
 * session.
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
 * Called when switching away from / disposing an account. `PasswordSession`
 * exposes no synchronous, hook-free way to mark itself destroyed without a
 * network logout (and `logout()`/`delete()` would revoke on the server, which
 * we do NOT want for a local switch - revocation is handled separately via the
 * push-token unregister temporary sessions). So we trip the kill-switch
 * installed in the session's injected `fetch` (see {@link makeSessionHooks} /
 * {@link registerBundleKillSwitch}): every subsequent request through this
 * session - direct fetch AND the internal auto-refresh, which shares the same
 * captured `options.fetch` - throws before touching the network. A tripped
 * refresh routes into the `onUpdateFailure` path (session preserved locally,
 * refresh token NOT consumed server-side). `kill()` also disarms the hooks so
 * the stale bundle can no longer dispatch into the reducer. The guarantee: this
 * session's tokens are no longer reachable by any live network path.
 */
export function disposeBundle(bundle: SessionBundle | PublicSessionBundle) {
  const session = bundle.session
  if (!session || session.destroyed) {
    return
  }
  bundleKillSwitches.get(bundle)?.()
}

/**
 * Hard bound on how many distinct refresh-token generations the expiry rescue
 * will burn through for a single did before giving up and logging out. Each
 * rescue consumes a strictly newer generation (a token that differs from every
 * one already recorded as failed), so this set can only grow one entry per
 * expiry and this cap guarantees termination even under a pathological storm
 * of expiries against ever-newer tokens.
 */
export const MAX_EXPIRY_RESCUE_GENERATIONS = 5

/**
 * Pure decision for the cross-tab expiry rescue (side-effecting rebuild stays
 * in the provider). Given the dying session's refreshJwt and the "latest known"
 * candidate accounts for that did (in preference order), pick the first
 * candidate that carries a usable, strictly-newer generation:
 *
 * - has a non-empty `refreshJwt`,
 * - whose `refreshJwt` DIFFERS from the dying one (a same-token candidate is
 *   just as dead), and
 * - whose `refreshJwt` is NOT already recorded as failed (loop guard).
 *
 * Returns `undefined` (fall through to logout) when nothing qualifies or the
 * failed-generation set has hit {@link MAX_EXPIRY_RESCUE_GENERATIONS}.
 *
 * `candidates` are tried in order, so the caller passes its most-authoritative
 * source first (on web, the fresh persisted re-read before the reducer state).
 */
export function pickExpiryRescueCandidate({
  dyingRefreshJwt,
  candidates,
  failedRefreshJwts,
}: {
  dyingRefreshJwt: string
  candidates: (SessionAccount | undefined)[]
  failedRefreshJwts: ReadonlySet<string>
}): SessionAccount | undefined {
  if (failedRefreshJwts.size >= MAX_EXPIRY_RESCUE_GENERATIONS) {
    return undefined
  }
  for (const candidate of candidates) {
    const refreshJwt = candidate?.refreshJwt
    if (
      refreshJwt &&
      refreshJwt !== dyingRefreshJwt &&
      !failedRefreshJwts.has(refreshJwt)
    ) {
      return candidate
    }
  }
  return undefined
}
