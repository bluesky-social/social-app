import {Linking} from 'react-native'
import {useMutation, useQuery} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {
  StripePrice,
  StripeProduct,
} from '#/state/purchases/subscriptions/types/stripe'
import {
  identifierToSubscriptionInfo,
  organizeSubscriptionsByTier,
} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'
import {BSKY_PURCHASES_API} from '#/env'

export function useAvailableSubscriptions() {
  const {currentAccount} = useSession()
  const currencyFormatter = useCurrencyFormatter()

  return useQuery<Subscriptions>({
    queryKey: ['availableSubscriptions', currentAccount!.did],
    async queryFn() {
      const res = await fetch(`${BSKY_PURCHASES_API}/getWebOffers`).then(res =>
        res.json(),
      )
      return organizeSubscriptionsByTier(
        normalizeProducts(res, {currencyFormatter}),
      )
    },
  })
}

export function usePurchaseSubscription() {
  return useMutation({
    async mutationFn(priceObject: any) {
      Linking.openURL(
        `${BSKY_PURCHASES_API}/initCheckout/${priceObject.price_id}`,
      )
    },
  })
}

function normalizeProducts(
  products: {product: StripeProduct; price: StripePrice}[],
  options: {
    currencyFormatter: ReturnType<typeof useCurrencyFormatter>
  },
): Subscription[] {
  return products
    .map(({product, price}) => {
      const info = identifierToSubscriptionInfo(product.id)

      if (!info) return

      const priceObj =
        price.currency_options[options.currencyFormatter.currency]
      const value = priceObj.unit_amount
      const formatted = options.currencyFormatter.format(value / 100)

      const subscription: Subscription = {
        info,
        price: {
          value,
          formatted,
        },
        raw: {
          price_id: price.id,
        },
      }

      return subscription
    })
    .filter(Boolean) as Subscription[]
}
