import {Linking} from 'react-native'
import {useMutation,useQuery} from '@tanstack/react-query'

import {api} from '#/state/purchases/api'
import {
  parseOfferingId,
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOffering,
} from '#/state/purchases/types'
import {IS_DEV} from '#/env'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{offerings: SubscriptionOffering[]}>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const {data, error} = await api(
        `/subscriptions/${group}?platform=web`,
      ).json()
      if (error || !data) {
        throw new Error('Failed to fetch subscription group')
      }

      const {offerings} = data

      return {
        offerings: offerings.map((o: any) => ({
          id: parseOfferingId(o.id),
          platform: PlatformId.Web,
          package: {
            priceId: o.productId,
          },
        })),
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
      if (offering.platform !== PlatformId.Web) {
        throw new Error('Unsupported platform')
      }

      const {data, error} = await api<{
        checkoutUrl: string
      }>('/checkout/create', {
        method: 'POST',
        json: {
          did,
          email,
          price: offering.package.priceId,
          redirectUrl: IS_DEV
            ? `http://localhost:19006/subscriptions`
            : `https://bsky.app/subscriptions`,
        },
      }).json()

      if (error || !data) {
        throw error
      }

      Linking.openURL(data.checkoutUrl)
    },
  })
}
