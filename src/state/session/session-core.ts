import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from '@atproto/lex-password-session'

import {networkRetry} from '#/lib/async/retry'
import {BLUESKY_PROXY_HEADER, PUBLIC_BSKY_SERVICE} from '#/lib/constants'
import {prefetchAgeAssuranceServerData} from '#/ageAssurance/data'
import {features} from '#/analytics'
import {
  BskyAppAgent,
  createPublicAgent,
  PasswordSessionManager,
} from './bridge-agent'
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
    if (event !== 'update') {
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
  const aa = prefetchAgeAssuranceServerData({agent: bundle.agent})

  /*
   * The proxy header is applied after the PDS-targeting setup above, so those
   * calls run without it.
   */
  bundle.agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  await Promise.all([gates, aa])
  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account =
    sessionDataToSessionAccount(
      session.session,
      session.session.service,
      storedAccount.pdsUrl,
    ) ?? storedAccount
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
  configureModerationForAccount(bundle.agent, earlyAccount)
  const aa = prefetchAgeAssuranceServerData({agent: bundle.agent})

  bundle.agent.configureProxy(BLUESKY_PROXY_HEADER.get())

  await Promise.all([gates, aa])
  // Preparation may auto-refresh the session while hooks are still disarmed.
  const account = sessionDataToSessionAccountOrThrow(session)
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
  const hooks = makeSessionHooks(
    onSessionChange,
    () => bundle,
    () => storedAccount.did,
  )
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
