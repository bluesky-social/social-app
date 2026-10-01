import {Sentry} from '#/logger/sentry/lib'

/**
 * Count affected installations using the same device ID as app analytics.
 */
export async function identifyDevice(
  existingDeviceId: string | undefined,
  deviceId: Promise<string>,
): Promise<void> {
  try {
    Sentry.setUser({id: existingDeviceId ?? (await deviceId)})
  } catch {
    // Device ID initialization is handled by app startup; telemetry is optional.
  }
}
