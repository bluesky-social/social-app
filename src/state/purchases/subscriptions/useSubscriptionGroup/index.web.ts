import {Linking} from 'react-native'
import {useQuery, useMutation} from '@tanstack/react-query'

import {IS_DEV} from '#/env'
import {api} from '#/state/purchases/subscriptions/api'
import {OfferingId, PlatformId, Offering, SubscriptionGroupId} from '#/state/purchases/subscriptions/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{ offerings: Offering[] }>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const { data, error } = await api(`/subscriptions/${group}?platform=web`).json()
      if (error || !data) {
        throw new Error('Failed to fetch subscription group')
      }

      const { offerings } = data

      return {
        offerings: offerings.map((o: any) => ({
          id: o.id as OfferingId,
          platform: PlatformId.Web,
          package: {
            priceId: o.productId,
          },
        })),
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
    }
  })
}
