import {getDeviceId} from '#/analytics/identifiers/device'
import {getSessionId} from '#/analytics/identifiers/session'

export * from '#/analytics/identifiers/device'
export * from '#/analytics/identifiers/session'

/** Snapshot identifiers at emission/evaluation time, not in React context. */
export function getIdentifiers() {
  return {
    deviceId: getDeviceId() ?? 'unknown',
    sessionId: getSessionId(),
  }
}
