import {
  type FeatureApiResponse,
  GrowthBook,
  type Options,
  type RefreshFeaturesOptions,
} from '@growthbook/growthbook'

import {Logger} from '#/logger'

const logger = Logger.create(Logger.Context.Growthbook)

/** Retain the newest known rules across SDK cache, network, and timeout updates. */
class GrowthBookWithFallback extends GrowthBook {
  private selectedPayload: FeatureApiResponse
  private selectedSource: 'html-fallback' | 'sdk' = 'html-fallback'
  private lastLoggedPayload: string | undefined
  private pendingPayload = Promise.resolve()

  constructor(options: Options, fallback: FeatureApiResponse) {
    super(options)
    this.selectedPayload = completePayload(fallback)
  }

  override setPayload(payload: FeatureApiResponse): Promise<void> {
    /*
     * init() sets an empty payload after a timeout, and refreshes can return an
     * older SDK cache entry. Neither should replace newer HTML or network data.
     * refreshFeatures() also reapplies getPayload() after failure; that must
     * retain its source until the SDK actually supplies another payload.
     */
    if (
      payload !== this.getPayload() &&
      payload.features &&
      Date.parse(payload.dateUpdated ?? '') >=
        Date.parse(this.selectedPayload.dateUpdated ?? '')
    ) {
      this.selectedPayload = completePayload(payload)
      this.selectedSource = 'sdk'
    }
    const selected = this.selectedPayload
    const source = this.selectedSource
    const pending = this.pendingPayload.then(async () => {
      await super.setPayload(selected)
      const logKey = `${source}:${selected.dateUpdated}`
      if (this.lastLoggedPayload !== logKey) {
        this.lastLoggedPayload = logKey
        logger.info(
          source === 'html-fallback'
            ? 'GrowthBook HTML fallback applied'
            : 'GrowthBook SDK configuration applied',
          {
            source,
            dateUpdated: selected.dateUpdated,
            featureCount: Object.keys(this.getFeatures()).length,
            savedGroupCount: Object.keys(
              this.getDecryptedPayload().savedGroups ?? {},
            ).length,
          },
        )
      }
    })
    // Keep later updates usable even if applying one payload fails.
    this.pendingPayload = pending.catch(() => {})
    return pending
  }

  override async refreshFeatures(options?: RefreshFeaturesOptions) {
    await super.refreshFeatures(options)
    /*
     * The SDK resolves without setting a payload on error/timeout. Session
     * startup awaits this shorter refresh rather than the initial 2s request.
     */
    await this.setPayload(this.getPayload())
  }
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
  return fallback
    ? new GrowthBookWithFallback(options, fallback)
    : new GrowthBook(options)
}
