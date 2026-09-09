import {useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewSandboxClient, useSession} from '#/state/session'
import {eric} from '#/lexicons'
import {narrowActivityPage} from './types'

export * from './types'

const useActivityV2QueryKeyRoot = 'useActivityV2Query'

export function useActivityV2Query() {
  const client = useAppviewSandboxClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount!.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useActivityV2QueryKeyRoot, {viewer}),
    queryFn: async ({pageParam}) => {
      const response = await client.call(eric.bsky.atmosphere.getActivity, {
        cursor: pageParam,
      })
      return narrowActivityPage(response)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.SECONDS.FIFTEEN,
  })
}
