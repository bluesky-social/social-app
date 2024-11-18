import {useQuery} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {api} from '#/state/purchases/subscriptions/api'

export function useEntitlements() {
  const {currentAccount} = useSession()

  return useQuery({
    enabled: !!currentAccount,
    queryKey: ['entitlements', currentAccount?.did],
    refetchOnWindowFocus: true,
    async queryFn() {
      const params = new URLSearchParams('/entitlements')
      params.set('did', currentAccount!.did)
      const url = `/entitlements?${params.toString()}`
      const {data, error} = await api<{
        entitlements: {id: 'core'; platform: 'web'}[]
      }>(url).json()

      if (error) {
        return []
      }

      return data?.entitlements
    },
  })
}
