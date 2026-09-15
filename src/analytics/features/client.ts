import {
  type FeatureApiResponse,
  GrowthBook,
  type Options,
  type RefreshFeaturesOptions,
} from '@growthbook/growthbook'

/** Retain the newest known rules across SDK cache, network, and timeout updates. */
class GrowthBookWithFallback extends GrowthBook {
  private selectedPayload: FeatureApiResponse
  private pendingPayload = Promise.resolve()

  constructor(options: Options, fallback: FeatureApiResponse) {
    super(options)
    this.selectedPayload = completePayload(fallback)
  }

  override setPayload(payload: FeatureApiResponse): Promise<void> {
    /*
     * init() sets an empty payload after a timeout, and refreshes can return an
     * older SDK cache entry. Neither should replace newer HTML or network data.
     */
    if (
      payload.features &&
      Date.parse(payload.dateUpdated ?? '') >=
        Date.parse(this.selectedPayload.dateUpdated ?? '')
    ) {
      this.selectedPayload = completePayload(payload)
    }
    const selected = this.selectedPayload
    const pending = this.pendingPayload.then(() => super.setPayload(selected))
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
