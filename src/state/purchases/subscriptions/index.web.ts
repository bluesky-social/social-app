import {Linking} from 'react-native'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {
  getMainSubscriptions,
  updateSubscription,
  cancelSubscription,
} from '#/state/purchases/subscriptions/api'
import {
  Subscription,
  SubscriptionTier,
} from '#/state/purchases/subscriptions/types'
import {organizeMainSubscriptionsByTier} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'
import {BSKY_PURCHASES_API} from '#/env'

const createMainSubscriptionsQueryKey = (did: string) => [
  'availableSubscriptions',
  did,
]

export function useMainSubscriptions() {
  const {currentAccount} = useSession()
  const currencyFormatter = useCurrencyFormatter({
    trailingZeroDisplay: 'stripIfInteger',
  })

  return useQuery<SubscriptionTier[]>({
    refetchOnWindowFocus: true,
    queryKey: createMainSubscriptionsQueryKey(currentAccount!.did),
    async queryFn() {
      const rawSubscriptions = await getMainSubscriptions({
        did: currentAccount!.did,
        platform: 'web',
        currency: currencyFormatter.currency,
      })
      const platformSubscriptions = rawSubscriptions.subscriptions.filter(
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

      return organizeMainSubscriptionsByTier(subscriptions)
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

export function useChangeSubscription() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn({prev, next}: {prev: Subscription; next: Subscription}) {
      if (
        prev.subscription.platform !== 'web' ||
        next.subscription.platform !== 'web'
      ) {
        throw new Error('Cannot purchase native subscription on web')
      }

      if (!prev.subscription.store.subscriptionId) {
        throw new Error(`Cannot change a subscription that doesn't exist`)
      }

      await updateSubscription({
        subscriptionId: prev.subscription.store.subscriptionId,
        newPriceId: next.subscription.store.priceId,
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: createMainSubscriptionsQueryKey(currentAccount!.did),
      })
    },
  })
}

export function useCancelSubscription() {
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    async mutationFn(subscription: Subscription) {
      if (subscription.subscription.platform !== 'web') {
        throw new Error('Cannot cancel native subscription on web')
      }

      if (!subscription.subscription.store.subscriptionId) {
        throw new Error(`Cannot cancel a subscription that doesn't exist`)
      }

      await cancelSubscription({
        subscriptionId: subscription.subscription.store.subscriptionId,
      })
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: createMainSubscriptionsQueryKey(currentAccount!.did),
      })
    },
  })
}
