import Purchases, {PURCHASES_ERROR_CODE} from 'react-native-purchases'
import {useMutation,useQuery} from '@tanstack/react-query'

import {isIOS} from '#/platform/detection'
import {api} from '#/state/purchases/api'
import {
  parseOfferingId,
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOffering,
} from '#/state/purchases/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{offerings: SubscriptionOffering[]}>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const platform = isIOS ? 'ios' : 'android'
      const {data, error, response} = await api(
        `/subscriptions/${group}?platform=${platform}`,
      ).json()
      if (error || !data) {
        console.log(error, response)
        throw new Error('Failed to fetch subscription group')
      }

      const {offerings} = data
      const productIds = offerings.map((o: any) => {
        return isIOS ? o.productId : o.productId.split(':')[0]
      })
      // console.log({ offers: false })
      // const offers = await Purchases.getOfferings()
      // console.log({ offers })
      const products = await Purchases.getProducts(productIds)

      return {
        offerings: offerings.map((o: any) => {
          const product = products.find(
            (p: any) => p.identifier === o.productId,
          )
          return {
            id: parseOfferingId(o.id),
            platform: isIOS ? PlatformId.Ios : PlatformId.Android,
            price: product?.priceString,
            package: product,
          }
        }),
      }
    },
  })
}

export function usePurchaseOffering() {
  return useMutation({
    async mutationFn({
      did,
      email,
      offering,
    }: {
      did: string
      email: string
      offering: SubscriptionOffering
    }) {
      if (offering.platform === PlatformId.Web) {
        throw new Error('Unsupported platform')
      }

      try {
        await Purchases.logIn(did)
        await Purchases.setEmail(email)
        await Purchases.purchaseStoreProduct(offering.package)
      } catch (e: any) {
        if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
          console.log('recipt error', e)
        }

        throw e
      }
    },
  })
}
