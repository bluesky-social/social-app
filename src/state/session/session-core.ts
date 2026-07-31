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
  buildBskyClient,
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

function deriveServiceUrl(session: PasswordSession | null): URL {
  return new URL(
    session && !session.destroyed
      ? session.session.service
      : PUBLIC_BSKY_SERVICE,
  )
}

/** Clients backed by one `PasswordSession`, the bundle's sole auth core. */
export type SessionBundle = {
  session: PasswordSession
  /** Authed appview client whose record helpers target the account's PDS. */
  bskyClient: Client
  chatClient: Client
  readonly service: URL
}

/**
 * `PasswordSession` exposes no local (logout-free) destroy, so disposal is
 * implemented by disabling its injected fetch and hooks. Keep that lifecycle
 * state private and tied to bundle identity.
 */
const bundleKillSwitches = new WeakMap<SessionBundle, () => void>()

/** Register the lifecycle closure used by {@link disposeBundle}. */
export function registerBundleKillSwitch(
  bundle: SessionBundle,
  kill: () => void,
) {
  bundleKillSwitches.set(bundle, kill)
}

export function buildBundle(session: PasswordSession): SessionBundle {
  return {
    session,
    bskyClient: buildBskyClient(session, []),
    chatClient: buildChatClient(session),
    get service() {
      return deriveServiceUrl(session)
    },
  }
}

/**
 * PasswordSession delivers `sessionData` before updating its live getter. The
 * provider uses that payload for rotated tokens and expiry rescue.
 */
type OnSessionChange = (
  bundle: SessionBundle,
  did: string,
  event: AtpSessionEvent,
  sessionData?: SessionData,
) => void

/**
 * Hooks stay inert during initial session preparation. `kill()` disarms them
 * and disables the injected fetch so a disposed session cannot refresh or
 * dispatch. The bundle getters are deferred because hooks are created first.
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

/** Clients exposed while logged out. */
export type PublicSessionBundle = {
  session: null
  bskyClient: Client
  chatClient: Client
  readonly service: URL
}

/** Build the logged-out bundle and configure guest moderation. */
export function createPublicSessionBundle(): PublicSessionBundle {
  configureModerationForGuest() // Side effect but only relevant for tests
  const publicClient = getPublicLexClient()
  return {
    session: null,
    bskyClient: publicClient,
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
    // The arm latch swallows resume's initial onUpdated event.
    session = await networkRetry(1, () =>
      PasswordSession.resume(sessionData, hooks),
    )
  } else {
    // Sync fast path: trust the stored tokens, no network.
    session = new PasswordSession(sessionData, hooks)
  }

  bundle = buildBundle(session)
  registerBundleKillSwitch(bundle, hooks.kill)
  // The returned account is captured again after asynchronous preparation.
  const earlyAccount =
    sessionDataToSessionAccount(session.session, session.session.service) ??
    storedAccount

  configureModerationForAccount(bundle, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({client: bundle.bskyClient})
  await Promise.all([gates, aa])
  // Preparation may auto-refresh the session while hooks are still disarmed.
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
  // Seed the hook's did before it is armed.
  const earlyAccount = sessionDataToSessionAccountOrThrow(session)
  accountDid = earlyAccount.did

  const gates = features.refresh({strategy: 'prefer-fresh-gates'})
  configureModerationForAccount(bundle, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({client: bundle.bskyClient})
  await Promise.all([gates, aa])
  // Preparation may auto-refresh the session while hooks are still disarmed.
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
  // Seed the hook and the deferred writes with refresh-stable account fields.
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
  const aa = prefetchAgeAssuranceServerData({client: bundle.bskyClient})

  // Not awaited so that we can still get into onboarding.
  // This is OK because we won't let you toggle adult stuff until you set the date.
  if (IS_PROD_SERVICE(service)) {
    void Promise.allSettled([
      networkRetry(3, () => {
        return bundle.bskyClient.call(setPersonalDetails, {
          birthDate,
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return bundle.bskyClient.call(upsertProfile, prev => {
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
        return bundle.bskyClient.call(overwriteSavedFeeds, [
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
            client: bundle.bskyClient,
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
        return bundle.bskyClient.call(setPersonalDetails, {
          birthDate,
        })
      }).catch(e => {
        logger.info(
          `createSessionBundleAndCreateAccount: failed to set birthDate`,
        )
        throw e
      }),
      networkRetry(3, () => {
        return bundle.bskyClient.call(upsertProfile, prev => {
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
  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account = sessionDataToSessionAccountOrThrow(session)
  hooks.arm()
  return {account, bundle}
}

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
 * Disable a replaced bundle without revoking its server session. PasswordSession
 * has no local destroy operation, so the registered lifecycle closure disables
 * its fetch and hooks instead.
 */
export function disposeBundle(bundle: SessionBundle | PublicSessionBundle) {
  const session = bundle.session
  if (!session || session.destroyed) {
    return
  }
  bundleKillSwitches.get(bundle)?.()
}

/** Maximum failed token generations considered during one expiry rescue. */
export const MAX_EXPIRY_RESCUE_GENERATIONS = 5

/** Pick the first unfailed token generation newer than the one that expired. */
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
