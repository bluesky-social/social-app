import {useMutation} from '@tanstack/react-query'

import {IS_DEV} from '#/env'
import {api} from '#/state/purchases/subscriptions/api'

export function useCreateCheckout() {
  return useMutation({
    async mutationFn(props: {
      price: string,
      did: string,
      email: string,
    }) {
      const {data, error} = await api<{
        checkoutUrl: string
      }>('/checkout/create', {
        method: 'POST',
        json: {
          ...props,
          redirectUrl: IS_DEV ? `http://localhost:19006/subscriptions` : `https://bsky.app/subscriptions`,
        }
      }).json()

      if (error) {
        throw error
      }

      return data
    },
  })
}
