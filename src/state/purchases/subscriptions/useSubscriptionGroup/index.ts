import React from 'react'
import {useQuery, useMutation} from '@tanstack/react-query'
import Purchases from 'react-native-purchases'

import {isIOS} from '#/platform/detection'
import {api} from '#/state/purchases/subscriptions/api'
import {OfferingId, PlatformId, Offering, SubscriptionGroupId} from '#/state/purchases/subscriptions/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{ offerings: Offering[] }>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const platform = isIOS ? 'ios' : 'android'
      const { data, error, response } = await api(`/subscriptions/${group}?platform=${platform}`).json()
      if (error || !data) {
        console.log(error, response)
        throw new Error('Failed to fetch subscription group')
      }

      const { offerings } = data
      const productIds = offerings.map((o: any) => {
        return isIOS ? o.productId : o.productId.split(':')[0]
      })
      // console.log({ offers: false })
      // const offers = await Purchases.getOfferings()
      // console.log({ offers })
      const products = await Purchases.getProducts(productIds)

      return {
        offerings: offerings.map((o: any) => {
          const product = products.find((p: any) => p.identifier === o.productId)
          return {
            id: o.id as OfferingId,
            platform: isIOS ? PlatformId.Ios : PlatformId.Android,
            price: product?.priceString,
            package: product,
          }
        }),
      }
    }
  })
}

export function usePurchaseOffering() {
  return useMutation({
    async mutationFn({
      did,
      email,
      offering,
    }: { did: string, email: string, offering: Offering }) {
      if (offering.platform === PlatformId.Web) {
        throw new Error('Unsupported platform')
      }

      Purchases.logIn(did)
      Purchases.setEmail(email)
      Purchases.purchaseStoreProduct(offering.package)
    }
  })
}
