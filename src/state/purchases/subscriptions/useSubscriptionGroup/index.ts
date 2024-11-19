import React from 'react'
import {useQuery, useMutation} from '@tanstack/react-query'

import {isIOS} from '#/platform/detection'
import {OfferingId, PlatformId, Offering, SubscriptionGroupId} from '#/state/purchases/subscriptions/types'

export function useSubscriptionGroup(group: SubscriptionGroupId) {
  return useQuery<{ offerings: Offering[] }>({
    queryKey: ['subscriptions', 'core'],
    queryFn() {
      return {
        offerings: [
          {
            id: OfferingId.CoreMonthly,
            platform: isIOS ? PlatformId.Ios : PlatformId.Android,
            price: 800,
            package: undefined,
          },
          {
            id: OfferingId.CoreAnnual,
            platform: isIOS ? PlatformId.Ios : PlatformId.Android,
            price: 8000,
            package: undefined,
          },
        ]
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
    }
  })
}
