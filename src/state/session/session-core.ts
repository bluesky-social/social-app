import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'

import {BLUESKY_PROXY_HEADER, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {prefetchAgeAssuranceServerData} from '#/ageAssurance/data'
import {features} from '#/analytics'
import {
  BskyAppAgent,
  createPublicAgent,
  PasswordSessionManager,
} from './bridge-agent'
import {agentToAppviewClient, agentToPdsClient} from './clients'
import {addSessionErrorLog} from './logging'
import {configureModerationForAccount} from './moderation'
import {networkAwareFetch} from './network'
import {
  isSessionExpired,
  sessionAccountToSessionData,
  sessionDataToSessionAccount,
} from './session-data'
import {type AtpSessionEvent, type SessionAccount} from './types'

export {networkAwareFetch} from './network'
export {
  isSignupQueued,
  sessionAccountToSessionData,
  sessionDataToSessionAccount,
} from './session-data'
export type {AtpSessionEvent} from './types'

/**
 * The service the bundle authenticated against.
 *
 * `PasswordSession`'s getters throw once the session is destroyed, so the read
 * is guarded and falls back to the public service.
 */
function deriveServiceUrl(session: PasswordSession | null): URL {
  return new URL(
    session && !session.destroyed
      ? session.session.service
      : PUBLIC_BSKY_SERVICE,
  )
}

/** An `AtpAgent` bridged over one `PasswordSession`, the bundle's sole auth core. */
export type SessionBundle = {
  session: PasswordSession
  agent: BskyAppAgent
  readonly service: URL
}

/**
 * `PasswordSession` exposes no local (logout-free) destroy, so disposal is
 * implemented by disabling its injected fetch and hooks. Keep that lifecycle
 * state private and tied to bundle identity.
 */
const bundleKillSwitches = new WeakMap<SessionBundle, () => void>()

/**
 * Register the lifecycle closure used by {@link disposeBundle}.
 *
 * Disposing also detaches the bridge agent from its session, so a stale
 * bundle's `agent.session` / `agent.pdsUrl` read as `undefined` rather than
 * serving tokens the app has stopped tracking.
 */
export function registerBundleKillSwitch(
  bundle: SessionBundle,
  kill: () => void,
) {
  bundleKillSwitches.set(bundle, () => {
    kill()
    bundle.agent.dispose()
  })
}

/**
 * Wrap a session in the bridge agent.
 *
 * `storedPdsUrl` seeds {@link PasswordSessionManager}'s PDS routing so requests
 * made before the first refresh delivers a didDoc still reach the right host.
 * Once a didDoc arrives the manager prefers its endpoint.
 */
export function buildBundle(
  session: PasswordSession,
  storedPdsUrl?: string,
): SessionBundle {
  const manager = new PasswordSessionManager(session, {
    service: deriveServiceUrl(session).toString(),
    pdsUrl: storedPdsUrl,
  })
  return {
    session,
    agent: new BskyAppAgent(manager),
    get service() {
      return deriveServiceUrl(session)
    },
  }
}

/**
 * PasswordSession delivers `sessionData` before updating its live getter. The
 * provider uses that payload for rotated tokens and expiry rescue.
 */
export type OnSessionChange = (
  bundle: SessionBundle,
  did: string,
  event: AtpSessionEvent,
  sessionData?: SessionData,
) => void

/**
 * Hooks stay inert during initial session preparation. `kill()` disarms them
 * and disables the injected fetch so a disposed session cannot refresh or
 * dispatch.
 */
export function makeSessionHooks({
  onSessionChange,
  getBundle,
  getDid,
}: {
  onSessionChange: OnSessionChange
  /** Deferred: hooks are created before the bundle exists. */
  getBundle: () => SessionBundle
  /** Deferred: hooks are created before the bundle exists. */
  getDid: () => string
}) {
  let armed = false
  let killed = false
  const dispatch = (event: AtpSessionEvent, sessionData?: SessionData) => {
    if (!armed) {
      return
    }
    /*
     * A hook must never throw. PasswordSession awaits its hooks inside the
     * assignment to its internal session promise, so a synchronous throw here
     * leaves that promise permanently rejected: every later request fails, and
     * because the session is never marked destroyed, disposeBundle cannot even
     * see that the bundle is dead. The dispatch path reaches reducer side
     * effects and event emitters, so treat it as capable of throwing.
     */
    try {
      const did = getDid()
      onSessionChange(getBundle(), did, event, sessionData)
      if (event !== 'update') {
        addSessionErrorLog(did, event)
      }
    } catch (e) {
      logger.error(e instanceof Error ? e : String(e), {
        message: `session: onSessionChange threw for a '${event}' event`,
      })
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

/** The agent exposed while logged out. */
export type PublicSessionBundle = {
  session: null
  agent: BskyAppAgent
  readonly service: URL
}

/**
 * Build the logged-out bundle. `createPublicAgent` installs the guest
 * moderation authorities as part of building the agent.
 */
export function createPublicSessionBundle(): PublicSessionBundle {
  return {
    session: null,
    agent: createPublicAgent(),
    service: new URL(PUBLIC_BSKY_SERVICE),
  }
}

/**
 * Run the prepare tail shared by the asynchronous factories.
 *
 * Preparation does real network work, so it can both reject and - when a
 * request gets a 401 and the session's own refresh then fails definitively -
 * destroy the session underneath us.
 *
 * A session destroyed during preparation is fatal rather than recoverable. The
 * hooks are still disarmed at that point, so the session's `expired` event was
 * swallowed and nothing will ever tell the reducer to log the account out;
 * returning the bundle anyway would leave the app looking signed in over a
 * session that can only make unauthenticated requests. Failing instead matches
 * what `CredentialSession.resumeSession` did on a revoked token, and every
 * caller already handles a rejected factory. Checking `destroyed` first also
 * keeps `PasswordSession`'s `Logged out` getter throw from escaping as the
 * opaque rejection a caller would surface, so `snapshot` only ever runs against
 * a live session.
 *
 * Both failure modes dispose: the bundle is fully built by this point, and a
 * still-live session left behind would keep its refresh and dispatch paths
 * alive with nothing tracking it. (Disposal is a no-op for the destroyed case,
 * where the session already refuses to refresh and the bridge agent already
 * reads as logged out - but the two paths are indistinguishable to the caller,
 * so both go through it.)
 */
export async function finishPreparation<T>(
  bundle: SessionBundle,
  preparation: Promise<unknown>,
  snapshot: () => T,
): Promise<T> {
  try {
    await preparation
    if (bundle.session.destroyed) {
      throw new Error('Session was revoked while it was being prepared')
    }
    return snapshot()
  } catch (e) {
    disposeBundle(bundle)
    throw e
  }
}

/**
 * Resume a stored account into a {@link SessionBundle}. Expired sessions take a
 * network resume; still-valid stored tokens take a synchronous no-network fast
 * path. Hooks are armed only after the prepare tail resolves.
 */
export async function createSessionBundleAndResume(
  storedAccount: SessionAccount,
  onSessionChange: OnSessionChange,
): Promise<{account: SessionAccount; bundle: SessionBundle}> {
  const gates = features.refresh({strategy: 'prefer-low-latency'})
  let bundle!: SessionBundle
  const hooks = makeSessionHooks({
    onSessionChange,
    getBundle: () => bundle,
    getDid: () => storedAccount.did,
  })

  let session: PasswordSession
  const sessionData = sessionAccountToSessionData(storedAccount)
  if (isSessionExpired(storedAccount)) {
    /*
     * The arm latch swallows resume's initial onUpdated event.
     *
     * There is deliberately no network retry here: `resume` rejects only when
     * the session is definitively invalid, and it swallows everything else -
     * a failed refresh reports through `onUpdateFailure` and resolves with the
     * stale tokens. So an offline cold start now stays signed in with dead
     * tokens (requests fail until connectivity returns) rather than throwing
     * the way the old `CredentialSession.resumeSession` did, and retrying a
     * definitive rejection would only repeat a request that cannot succeed.
     */
    session = await PasswordSession.resume(sessionData, hooks)
  } else {
    // Sync fast path: trust the stored tokens, no network.
    session = new PasswordSession(sessionData, hooks)
  }

  bundle = buildBundle(session, storedAccount.pdsUrl)
  registerBundleKillSwitch(bundle, hooks.kill)
  // The returned account is captured again after asynchronous preparation.
  const earlyAccount =
    sessionDataToSessionAccount(
      session.session,
      session.session.service,
      storedAccount.pdsUrl,
    ) ?? storedAccount

  configureModerationForAccount(bundle.agent, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: agentToAppviewClient(bundle.agent),
    accountClient: agentToPdsClient(bundle.agent),
  })

  /*
   * The proxy header is applied after the PDS-targeting setup above, so those
   * calls run without it.
   */
  bundle.agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account = await finishPreparation(
    bundle,
    Promise.all([gates, aa]),
    () =>
      sessionDataToSessionAccount(
        session.session,
        session.session.service,
        storedAccount.pdsUrl,
      ) ?? storedAccount,
  )
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
  const hooks = makeSessionHooks({
    onSessionChange,
    getBundle: () => bundle,
    getDid: () => accountDid,
  })

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
  configureModerationForAccount(bundle.agent, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({
    appviewClient: agentToAppviewClient(bundle.agent),
    accountClient: agentToPdsClient(bundle.agent),
  })

  bundle.agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account = await finishPreparation(
    bundle,
    Promise.all([gates, aa]),
    () => sessionDataToSessionAccountOrThrow(session),
  )
  hooks.arm()
  return {account, bundle}
}

/**
 * Rebuild a bundle synchronously from stored tokens. The optional guard runs
 * after construction but before hooks are armed; rejected bundles are disposed.
 */
export function createSessionBundleFromStoredAccount(
  storedAccount: SessionAccount,
  onSessionChange: OnSessionChange,
  shouldActivate: (
    bundle: SessionBundle,
    account: SessionAccount,
  ) => boolean = () => true,
): {account: SessionAccount; bundle: SessionBundle} | undefined {
  let bundle!: SessionBundle
  const hooks = makeSessionHooks({
    onSessionChange,
    getBundle: () => bundle,
    getDid: () => storedAccount.did,
  })
  const session = new PasswordSession(
    sessionAccountToSessionData(storedAccount),
    hooks,
  )
  bundle = buildBundle(session, storedAccount.pdsUrl)
  registerBundleKillSwitch(bundle, hooks.kill)
  configureModerationForAccount(bundle.agent, storedAccount)
  bundle.agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  const account = session.destroyed
    ? storedAccount
    : (sessionDataToSessionAccount(
        session.session,
        session.session.service,
        storedAccount.pdsUrl,
      ) ?? storedAccount)
  if (!shouldActivate(bundle, account)) {
    disposeBundle(bundle)
    return undefined
  }
  hooks.arm()
  return {account, bundle}
}

export function sessionDataToSessionAccountOrThrow(
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
