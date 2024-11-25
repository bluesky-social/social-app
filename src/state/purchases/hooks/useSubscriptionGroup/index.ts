import Purchases from 'react-native-purchases'
import {useQuery} from '@tanstack/react-query'

import {isAndroid} from '#/platform/detection'
import {api} from '#/state/purchases/api'
import {
  APIOffering,
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOffering,
} from '#/state/purchases/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{offerings: SubscriptionOffering[]}>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const platform = isAndroid ? 'android' : 'ios'
      const {data, error} = await api<{
        offerings: APIOffering[]
      }>(`/subscriptions/${group}?platform=${platform}`).json()

      if (error || !data) {
        throw new Error(`Failed to fetch subscription group`)
      }

      const {offerings} = data
      const revenueCatIdentifiers = offerings.map(o =>
        isAndroid ? parseIdentifierFromAndroidProductId(o.product) : o.product,
      )
      const products = await Purchases.getProducts(revenueCatIdentifiers)

      const parsed: SubscriptionOffering[] = []
      for (const o of offerings) {
        if (o.platform === PlatformId.Web) continue

        const product = products.find(p => p.identifier === o.product)
        if (!product) continue

        parsed.push({
          id: o.id,
          platform: o.platform,
          package: product,
        })
      }

      return {
        offerings: parsed,
      }
    },
  })
}

/**
 * Whereas iOS has separate product IDs for each subscription product, Android
 * has a single ID with a suffixed payment plan e.g. `monthly` and `annual` for
 * our core offerings.
 *
 * However, the full "identifier" is concatenated, so we just pass around the
 * full thing and parse from there.
 */
function parseIdentifierFromAndroidProductId(productId: string) {
  if (!productId.includes(':')) {
    throw new Error(
      `Expected Android product ID to contain a colon: ${productId}`,
    )
  }

  return productId.split(':')[0]
}
