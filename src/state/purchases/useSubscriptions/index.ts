import Purchases, {PurchasesPackage} from 'react-native-purchases'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation,useQuery} from '@tanstack/react-query'

import {Subscription} from '#/state/purchases/useSubscriptions/types'
import {identifierToSubscriptionInfo} from '#/state/purchases/useSubscriptions/util'
import {useSession} from '#/state/session'

export function useAvailableSubscriptions() {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const did = currentAccount!.did

  return useQuery<Subscription[]>({
    queryKey: ['availableSubscriptions', did],
    async queryFn() {
      Purchases.logIn(did)
      const offerings = await Purchases.getOfferings()
      if (
        offerings.current !== null &&
        offerings.current.availablePackages.length !== 0
      ) {
        return normalizePackages(offerings.current.availablePackages)
      }
      throw new Error(_(msg`Error loading subscriptions`))
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
      return {
        info,
        pricing: {
          formatted: p.product.priceString,
          value: p.product.price,
        },
        raw: p,
      }
    })
    .filter(Boolean) as Subscription[]
}
