import {
  type FeatureApiResponse,
  GrowthBook,
  type Options,
  type RefreshFeaturesOptions,
} from '@growthbook/growthbook'

import {Logger} from '#/logger'

const logger = Logger.create(Logger.Context.Growthbook)
const lastLoggedPayload = new WeakMap<GrowthBook, string>()

function logPayload(client: GrowthBook, source: 'html-fallback' | 'sdk'): void {
  const payload = client.getDecryptedPayload()
  const logKey = `${source}:${payload.dateUpdated}`
  if (lastLoggedPayload.get(client) === logKey) return

  lastLoggedPayload.set(client, logKey)
  logger.info(
    source === 'html-fallback'
      ? 'GrowthBook HTML fallback applied'
      : 'GrowthBook SDK configuration applied',
    {
      source,
      dateUpdated: payload.dateUpdated,
      featureCount: Object.keys(client.getFeatures()).length,
      savedGroupCount: Object.keys(payload.savedGroups ?? {}).length,
    },
  )
}

/** The SDK merges optional fields; an omitted group/experiment list must clear the previous one. */
function completePayload(payload: FeatureApiResponse): FeatureApiResponse {
  return {
    ...payload,
    savedGroups: payload.savedGroups ?? {},
    experiments: payload.experiments ?? [],
  }
}

/** Preserve the normal SDK path when no matching HTML snapshot is available. */
export function createGrowthBook(
  options: Options,
  fallback?: FeatureApiResponse,
): GrowthBook {
  if (!fallback) return new GrowthBook(options)

  const payload = completePayload(fallback)
  /* initSync does not copy savedGroups into the evaluation context in v1.6.5. */
  const client = new GrowthBook({...options, savedGroups: payload.savedGroups})
  client.initSync({payload})
  logPayload(client, 'html-fallback')
  return client
}

/** Refresh a synchronously initialized fallback without allowing older cache data to win. */
export async function refreshGrowthBook(
  client: GrowthBook,
  options?: RefreshFeaturesOptions,
): Promise<void> {
  const previous = client.getPayload()
  await client.refreshFeatures({...options, skipCache: true})
  let current = client.getPayload()
  const currentRevision = Date.parse(current.dateUpdated ?? '')

  if (
    !Number.isFinite(currentRevision) ||
    currentRevision < Date.parse(previous.dateUpdated ?? '')
  ) {
    await client.setPayload(previous)
    return
  }
  if (current === previous) return

  if (!current.savedGroups || !current.experiments) {
    current = completePayload(current)
    await client.setPayload(current)
  }
  logPayload(client, 'sdk')
}
