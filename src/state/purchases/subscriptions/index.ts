import Purchases, {PurchasesPackage} from 'react-native-purchases'
import {useMutation, useQuery} from '@tanstack/react-query'

import {
  Subscription,
  Subscriptions,
} from '#/state/purchases/subscriptions/types'
import {
  identifierToSubscriptionInfo,
  organizeSubscriptionsByTier,
} from '#/state/purchases/subscriptions/util'
import {useSession} from '#/state/session'

export function useAvailableSubscriptions() {
  const {currentAccount} = useSession()
  const did = currentAccount!.did

  return useQuery<Subscriptions>({
    queryKey: ['availableSubscriptions', did],
    async queryFn() {
      Purchases.logIn(did)
      const offerings = await Purchases.getOfferings()
      const tierOfferings = Object.values(offerings.all).filter(offering => {
        return offering.identifier.includes('bsky_tier')
      })
      const packages = tierOfferings.flatMap(
        offering => offering.availablePackages,
      )
      return organizeSubscriptionsByTier(normalizePackages(packages))
    },
  })
}

export function usePurchaseSubscription() {
  return useMutation({
    async mutationFn(pkg: PurchasesPackage) {
      return Purchases.purchasePackage(pkg)
    },
  })
}

function normalizePackages(pkgs: PurchasesPackage[]): Subscription[] {
  return pkgs
    .map(p => {
      const info = identifierToSubscriptionInfo(p.product.identifier)
      if (!info) return
      const subscription: Subscription = {
        info,
        price: {
          formatted: p.product.priceString,
          value: p.product.price,
        },
        raw: p,
      }
      return subscription
    })
    .filter(Boolean) as Subscription[]
}
