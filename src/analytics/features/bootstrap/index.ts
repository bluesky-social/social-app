import {type FeatureApiResponse} from '@growthbook/growthbook'

/** Native and static development builds have no server-provided snapshot. */
export function readFeatureBootstrap(_options: {
  apiHost: string
  clientKey: string
}): FeatureApiResponse | undefined {
  return undefined
}
