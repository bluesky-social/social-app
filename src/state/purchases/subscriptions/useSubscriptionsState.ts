import {useQuery} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {api} from '#/state/purchases/subscriptions/api'
import {SubscriptionGroupId, PlatformId, Subscription} from '#/state/purchases/subscriptions/types'

export function useSubscriptionsState() {
  const {currentAccount} = useSession()

  return useQuery({
    enabled: !!currentAccount,
    queryKey: ['subscriptions-state', currentAccount?.did],
    refetchOnWindowFocus: true,
    async queryFn() {
      const url = `/account?did=${currentAccount!.did}`
      const {data, error} = await api<{
        subscriptions: Subscription[]
        entitlements: {id: 'core'; platform: 'web'}[]
      }>(url).json()

      if (error || !data) {
        throw new Error('Failed to fetch subscriptions state')
      }

      return data
    },
  })
}
