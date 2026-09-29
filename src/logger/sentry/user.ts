import {Sentry} from '#/logger/sentry/lib'

/**
 * Count affected browser installations using the app's existing device ID.
 * This does not identify an account or enable IP-based user inference.
 */
export async function identifyWebDevice(
  deviceId: Promise<string>,
): Promise<void> {
  try {
    Sentry.setUser({id: await deviceId})
  } catch {
    // Device ID initialization is handled by app startup; telemetry is optional.
  }
}
