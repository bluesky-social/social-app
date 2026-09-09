import {useInfiniteQuery} from '@tanstack/react-query'

import {useAppviewSandboxClient, useSession} from '#/state/session'
import {eric} from '#/lexicons'
import {narrowActivityPage} from './atmosphereActivityTypes'
import {STALE} from './index'
import {createQueryKey} from './util'

export * from './atmosphereActivityTypes'

const useAtmosphereActivityQueryKeyRoot = 'useAtmosphereActivityQuery'

export function useAtmosphereActivityQuery() {
  const client = useAppviewSandboxClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount!.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useAtmosphereActivityQueryKeyRoot, {viewer}),
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
