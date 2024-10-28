import Purchases from 'react-native-purchases'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {isAndroid} from '#/platform/detection'
import {getMainSubscriptions} from '#/state/purchases/subscriptions/api'
import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {organizeMainSubscriptionsByTier} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'

export function useMainSubscriptions() {
  const {currentAccount} = useSession()
  const did = currentAccount!.did

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
        new Set(platformSubscriptions.map(s => s.lookupKey)),
      )
      const products = await Purchases.getProducts(lookupKeys)
      const subscriptions: Subscription[] = platformSubscriptions
        .map(sub => {
          const productData = products.find(p => p.identifier === sub.storeId)
          if (!productData) return undefined
          const subscription = {
            ...sub,
            price: {
              value: productData.price * 100, // convert to cents
              formatted: productData.priceString,
            },
            product: {
              platform,
              data: productData,
            },
          }
          return subscription
        })
        .filter(Boolean) as Subscription[]

      return {
        active: rawSubscriptions.active,
        available: organizeMainSubscriptionsByTier(subscriptions),
      }
    },
  })
}

export function usePurchaseSubscription() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(product: Subscription['product']) {
      if (product.platform === 'web') {
        throw new Error('Cannot purchase web subscription on native')
      }
      // TODO don't do this here
      Purchases.addCustomerInfoUpdateListener(_info => {
        queryClient.invalidateQueries({
          queryKey: ['availableSubscriptions', currentAccount!.did],
        })
      })
      return Purchases.purchaseStoreProduct(product.data)
    },
  })
}
