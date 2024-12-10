import {Linking} from 'react-native'
import {useMutation} from '@tanstack/react-query'

import {api} from '#/state/purchases/api'
import {PlatformId, SubscriptionOffering} from '#/state/purchases/types'
import {IS_DEV} from '#/env'

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
        throw new Error(`Failed to create checkout URL`)
      }

      Linking.openURL(data.checkoutUrl)
    },
  })
}
