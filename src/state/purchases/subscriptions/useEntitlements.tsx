import {useQuery} from '@tanstack/react-query'

import {getEntitlements} from '#/state/purchases/subscriptions/api'
import {useSession} from '#/state/session'

export function useEntitlements() {
  const {currentAccount} = useSession()
  return useQuery({
    queryKey: ['entitlements', currentAccount!.did],
    async queryFn() {
      return getEntitlements({did: currentAccount!.did})
    },
  })
}
