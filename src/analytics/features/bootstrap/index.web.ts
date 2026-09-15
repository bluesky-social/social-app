import {type FeatureApiResponse} from '@growthbook/growthbook'

/** Match GrowthBook's four-hour cache lifetime without expiring unchanged gates. */
const MAX_AGE = 4 * 60 * 60 * 1000

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFeature(value: unknown): boolean {
  return (
    isObject(value) &&
    (value.rules === undefined ||
      (Array.isArray(value.rules) && value.rules.every(isObject)))
  )
}

/** Read the optional public snapshot before the deferred app bundle initializes. */
export function readFeatureBootstrap({
  apiHost,
  clientKey,
}: {
  apiHost: string
  clientKey: string
}): FeatureApiResponse | undefined {
  if (typeof document === 'undefined') return undefined
  const text = document.getElementById('bsky-app-config')?.textContent
  if (!text) return undefined

  try {
    const data: unknown = JSON.parse(text)
    if (
      !isObject(data) ||
      data.schemaVersion !== 1 ||
      data.apiHost !== apiHost.replace(/\/+$/, '') ||
      data.clientKey !== clientKey ||
      typeof data.fetchedAt !== 'string' ||
      !Number.isFinite(Date.parse(data.fetchedAt)) ||
      Date.now() - Date.parse(data.fetchedAt) > MAX_AGE
    ) {
      return undefined
    }
    const payload = data.payload
    if (
      !isObject(payload) ||
      !isObject(payload.features) ||
      !Object.values(payload.features).every(isFeature) ||
      typeof payload.dateUpdated !== 'string' ||
      !Number.isFinite(Date.parse(payload.dateUpdated)) ||
      (payload.savedGroups !== undefined &&
        (!isObject(payload.savedGroups) ||
          !Object.values(payload.savedGroups).every(Array.isArray)))
    ) {
      return undefined
    }
    return payload
  } catch {
    // A missing or invalid snapshot must never prevent the app from starting.
    return undefined
  }
}
