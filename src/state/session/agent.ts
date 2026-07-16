import {
  Agent as BaseAgent,
  type AtprotoServiceType,
  type Did,
} from '@atproto/api'

import {createPublicSessionBundle, type SessionAgent} from './session-core'

/*
 * Phase 2 SDK migration: the PasswordSession-based session core (factories,
 * bridge agent, converters) lives in session-core.ts. This module is now a
 * thin compat layer that keeps the few external imports working:
 * - `createPublicAgent` (drafts) -> the public bundle's bridge agent
 * - `Agent` (pds-detection / forgot-password / set-new-password) -> the
 *   proxy-header base Agent subclass
 * - `ProxyHeaderValue` (constants)
 * - the new converters, re-exported under their own names
 */
export {
  sessionAccountToSessionData,
  sessionDataToSessionAccount,
} from './session-core'

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

/**
 * The logged-out bridge agent, pointed at the public appview. Returns the
 * public bundle's `agent` (a {@link SessionAgent}). Kept for `drafts/state/api`
 * and any other public-read consumers.
 */
export function createPublicAgent(): SessionAgent {
  return createPublicSessionBundle().agent
}

export class Agent extends BaseAgent {
  constructor(
    proxyHeader: ProxyHeaderValue | null,
    ...options: ConstructorParameters<typeof BaseAgent>
  ) {
    super(...options)
    if (proxyHeader) {
      this.configureProxy(proxyHeader)
    }
  }
}
