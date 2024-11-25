import {useQuery} from '@tanstack/react-query'

import {api} from '#/state/purchases/api'
import {
  APIOffering,
  PlatformId,
  SubscriptionGroupId,
  SubscriptionOffering,
} from '#/state/purchases/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{offerings: SubscriptionOffering[]}>({
    queryKey: ['subscription-group', group],
    async queryFn() {
      const {data, error} = await api<{
        offerings: APIOffering[]
      }>(`/subscriptions/${group}?platform=web`).json()
      if (error || !data) {
        throw new Error('Failed to fetch subscription group')
      }

      const {offerings} = data

      const parsed: SubscriptionOffering[] = []

      for (const o of offerings) {
        if (o.platform !== PlatformId.Web) continue

        parsed.push({
          id: o.id,
          platform: o.platform,
          package: {
            priceId: o.product,
          },
        })
      }

      return {
        offerings: parsed,
      }
    },
  })
}
