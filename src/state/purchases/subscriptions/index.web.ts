import {Linking} from 'react-native'
import {useMutation, useQuery} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {getMainSubscriptions} from '#/state/purchases/subscriptions/api'
import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {organizeMainSubscriptionsByTier} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'
import {BSKY_PURCHASES_API} from '#/env'

export function useMainSubscriptions() {
  const {currentAccount} = useSession()
  const currencyFormatter = useCurrencyFormatter()

  return useQuery<Subscriptions>({
    queryKey: ['availableSubscriptions', currentAccount!.did],
    async queryFn() {
      const rawSubscriptions = await getMainSubscriptions({
        did: currentAccount!.did,
        platform: 'web',
      })
      const platformSubscriptions = rawSubscriptions.available.filter(
        s => s.platform === 'web',
      )
      const subscriptions: Subscription[] = platformSubscriptions.map(sub => {
        return {
          id: sub.id,
          platform: 'web',
          interval: sub.interval,
          subscription: sub,
          price: {
            value: sub.store.price,
            formatted: currencyFormatter.format(sub.store.price / 100),
          },
          // TODO may need to have si_id too
          product: sub.store.priceId,
        }
      })

      const active: Subscription[] = rawSubscriptions.active.map(sub => {
        if (sub.platform === 'web') {
          const s: Subscription = {
            id: sub.id,
            platform: 'web',
            interval: sub.interval,
            subscription: sub,
            price: {
              value: sub.store.price,
              formatted: currencyFormatter.format(sub.store.price / 100),
            },
            // TODO may need to have si_id too
            product: sub.store.priceId,
          }
          return s
        }

        const s: Subscription = {
          id: sub.id,
          platform: sub.platform,
          interval: sub.interval,
          subscription: sub,
          price: {
            value: 0,
            formatted: '',
          },
          product: undefined,
        }
        return s
      })

      return {
        /**
         * TODO decorate this too
         */
        active: active,
        available: organizeMainSubscriptionsByTier(subscriptions),
      }
    },
  })
}

export function usePurchaseSubscription() {
  const {currentAccount} = useSession()
  return useMutation({
    async mutationFn(subscription: Subscription) {
      if (subscription.platform !== 'web') {
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
            price: subscription.product,
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
