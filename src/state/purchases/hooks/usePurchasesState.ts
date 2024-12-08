import {useQuery} from '@tanstack/react-query'

import {api} from '#/state/purchases/api'
import {APIEntitlement,APISubscription} from '#/state/purchases/types'
import {useSession} from '#/state/session'

export const rootPurchasesStateQueryKey = 'subscriptions-state'
export const createPurchasesStateQueryKey = (did?: string) => [
  rootPurchasesStateQueryKey,
  did,
]

export function usePurchasesState() {
  const {currentAccount} = useSession()

  return useQuery({
    enabled: !!currentAccount,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 2,
    queryKey: createPurchasesStateQueryKey(currentAccount?.did),
    async queryFn() {
      const {data, error} = await api<{
        email: string
        subscriptions: APISubscription[]
        entitlements: APIEntitlement[]
      }>(`/account?did=${currentAccount!.did}`).json()

      if (error || !data) {
        throw new Error('Failed to fetch subscriptions state')
      }

      return data
    },
  })
}
