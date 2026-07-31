import {
  Agent as BaseAgent,
  type AtprotoServiceType,
  type Did,
} from '@atproto/api'

export type ProxyHeaderValue = `${Did}#${AtprotoServiceType}`

/**
 * A bare `Agent` that applies a service-proxy header on construction.
 *
 * Used for the unauthenticated, service-specific calls that cannot go through
 * the session agent (PDS detection, password reset, handle availability).
 */
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
