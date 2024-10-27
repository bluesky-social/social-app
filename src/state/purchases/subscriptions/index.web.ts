import {Linking} from 'react-native'
import {useMutation, useQuery} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {getSubscriptions} from '#/state/purchases/subscriptions/api'
import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {organizeSubscriptionsByTier} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'
import {BSKY_PURCHASES_API} from '#/env'

export function useAvailableSubscriptions() {
  const {currentAccount} = useSession()
  const currencyFormatter = useCurrencyFormatter()

  return useQuery<Subscriptions>({
    queryKey: ['availableSubscriptions', currentAccount!.did],
    async queryFn() {
      const rawSubscriptions = await getSubscriptions({
        did: currentAccount!.did,
        platform: 'web',
      })
      const platformSubscriptions = rawSubscriptions.filter(
        s => s.platform === 'web',
      )
      const subscriptions = platformSubscriptions.map(sub => {
        const subscription: Subscription = {
          ...sub,
          price: {
            value: sub.price,
            formatted: currencyFormatter.format(sub.price / 100),
          },
          product: {
            platform: 'web',
            data: sub.checkoutId,
          },
        }
        return subscription
      })

      return organizeSubscriptionsByTier(subscriptions)
    },
  })
}

export function usePurchaseSubscription() {
  const {currentAccount} = useSession()
  return useMutation({
    async mutationFn(product: Subscription['product']) {
      if (product.platform !== 'web') {
        throw new Error('Cannot purchase native subscription on web')
      }
      if (!currentAccount || !currentAccount.email) {
        throw new Error('No account or email')
      }

      const {checkoutUrl} = await fetch(
        `${BSKY_PURCHASES_API}/createCheckout`,
        {
          method: 'POST',
          body: JSON.stringify({
            price: product.data,
            // TODO should NOT use query, use auth and our db state
            user: currentAccount.did,
            email: currentAccount.email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ).then(res => res.json())
      Linking.openURL(checkoutUrl)
    },
  })
}
