import Purchases from 'react-native-purchases'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {isAndroid} from '#/platform/detection'
import {getMainSubscriptions} from '#/state/purchases/subscriptions/api'
import {Subscription as APISubscription} from '#/state/purchases/subscriptions/api/types'
import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {organizeMainSubscriptionsByTier} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'

export function useMainSubscriptions() {
  const {currentAccount} = useSession()
  const did = currentAccount!.did
  const currencyFormatter = useCurrencyFormatter()

  return useQuery<Subscriptions>({
    queryKey: ['availableSubscriptions', did],
    async queryFn() {
      const platform = isAndroid ? 'android' : 'ios'
      const rawSubscriptions = await getMainSubscriptions({
        did: currentAccount!.did,
        platform,
      })
      const platformSubscriptions = rawSubscriptions.available
        .filter(s => s.platform !== 'web')
        .filter(s => s.platform === platform)
      const lookupKeys = Array.from(
        new Set(platformSubscriptions.map(s => s.store.productLookupKey)),
      )
      const products = await Purchases.getProducts(lookupKeys)

      function decorateSubscription(
        sub: APISubscription,
      ): Subscription | undefined {
        if (sub.platform === 'web') {
          return {
            id: sub.id,
            platform: sub.platform,
            interval: sub.interval,
            subscription: sub,
            price: {
              value: sub.store.price, // convert to cents
              formatted: currencyFormatter.format(sub.store.price / 100),
            },
            product: sub.store.priceId,
          }
        }

        const productData = products.find(
          p => p.identifier === sub.store.productId,
        )

        if (!productData) return undefined

        return {
          id: sub.id,
          platform: sub.platform,
          interval: sub.interval,
          subscription: sub,
          price: {
            value: productData.price * 100, // convert to cents
            formatted: productData.priceString,
          },
          product: productData,
        }
      }
      const subscriptions = platformSubscriptions
        .map(decorateSubscription)
        .filter(Boolean) as Subscription[]
      const active = rawSubscriptions.active
        .map(decorateSubscription)
        .filter(Boolean) as Subscription[]

      return {
        active: active,
        available: organizeMainSubscriptionsByTier(subscriptions),
      }
    },
  })
}

export function usePurchaseSubscription() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(subscription: Subscription) {
      if (subscription.platform === 'web') {
        throw new Error('Cannot purchase web subscription on native')
      }

      if (!subscription.product) {
        throw new Error('Subscription product not found')
      }

      // TODO don't do this here
      Purchases.addCustomerInfoUpdateListener(_info => {
        queryClient.invalidateQueries({
          queryKey: ['availableSubscriptions', currentAccount!.did],
        })
      })

      return Purchases.purchaseStoreProduct(subscription.product)
    },
  })
}
