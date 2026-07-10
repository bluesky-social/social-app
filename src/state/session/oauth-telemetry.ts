import {type Metrics} from '#/analytics/metrics'

type OauthTelemetryEvent =
  | {type: 'oauth:sessionDeleted'; payload: Metrics['oauth:sessionDeleted']}
  | {type: 'oauth:sessionRefreshed'; payload: Metrics['oauth:sessionRefreshed']}
  | {type: 'oauth:refreshFailed'; payload: Metrics['oauth:refreshFailed']}
  | {
      type: 'oauth:sessionResumeFailed'
      payload: Metrics['oauth:sessionResumeFailed']
    }

export type OauthTelemetrySink = (event: OauthTelemetryEvent) => void

let sink: OauthTelemetrySink | null = null
const pending: OauthTelemetryEvent[] = []

// The browser OAuth client is constructed once at module load, before the
// React Provider mounts. Until the Provider registers a sink, events are
// queued in memory so we don't drop early-boot signals (e.g. a failed
// session restore that happens during initial init()).
export function setOauthTelemetrySink(next: OauthTelemetrySink | null) {
  sink = next
  if (sink && pending.length) {
    const drained = pending.splice(0, pending.length)
    for (const event of drained) sink(event)
  }
}

export function emitOauthTelemetry(event: OauthTelemetryEvent) {
  if (sink) {
    sink(event)
  } else {
    pending.push(event)
    // Bound the queue so a stuck sink can't grow memory unbounded.
    if (pending.length > 50) pending.shift()
  }
}

export function truncateOauthMessage(err: unknown): string | undefined {
  let str: string
  if (err instanceof Error) {
    str = err.message
  } else if (typeof err === 'string') {
    str = err
  } else if (err && typeof err === 'object' && 'message' in err) {
    str = String(err.message)
  } else {
    return undefined
  }
  return str.slice(0, 200)
}

export function categorizeOauthError(
  err: unknown,
): Metrics['oauth:sessionResumeFailed']['errorCategory'] {
  let str: string
  if (err instanceof Error) {
    str = err.message
  } else if (typeof err === 'string') {
    str = err
  } else if (err && typeof err === 'object' && 'message' in err) {
    str = String(err.message)
  } else {
    str = ''
  }
  if (
    str.includes('session was deleted by another process') ||
    str.includes('The session was revoked')
  ) {
    return 'sessionDeleted'
  }
  // PDS oauth-provider returns `invalid_grant: Session expired` when the
  // session age exceeds the public/confidential client lifetime. The OAuth
  // client surfaces this as Error('Session expired') and follows up by
  // deleting the local session.
  if (
    str.includes('Session expired') ||
    (str.includes('invalid_grant') && str.includes('Session expired'))
  ) {
    return 'sessionExpired'
  }
  if (
    str.includes('Database closed') ||
    str.includes('Database has been disposed')
  ) {
    return 'databaseClosed'
  }
  if (str.includes('invalid_dpop_proof') && str.includes('iat claim')) {
    return 'dpopSkew'
  }
  if (str.includes('invalid_dpop_proof')) {
    return 'dpopOther'
  }
  if (str.includes('No refresh token available')) {
    return 'refreshExhausted'
  }
  if (
    str.includes('Token set sub mismatch') ||
    str.includes('Stored session sub mismatch')
  ) {
    return 'subMismatch'
  }
  if (str.includes('timed out') || str.includes('Session resume timed out')) {
    return 'timeout'
  }
  if (
    str.includes('Failed to fetch') ||
    str.includes('Network request failed') ||
    str.includes('Load failed') ||
    // Firefox raw fetch failure when network is offline / URL is blocked
    str.includes('NetworkError when attempting to fetch')
  ) {
    return 'network'
  }
  // Generic invalid_grant catch-all that isn't a known sub-case above.
  if (str.includes('invalid_grant')) {
    return 'invalidGrant'
  }
  return 'unknown'
}
