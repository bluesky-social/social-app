import {useInfiniteQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {useAppviewSandboxClient, useSession} from '#/state/session'
import {eric} from '#/lexicons'
import {narrowActivityPage} from './types'

export * from './types'

const useAtmosphereQueryKeyRoot = 'useAtmosphereQuery'
const useAtmosphereRawQueryKeyRoot = 'useAtmosphereRawQuery'

export function useAtmosphereQuery() {
  const client = useAppviewSandboxClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount!.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useAtmosphereQueryKeyRoot, {viewer}),
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

export function useAtmosphereRawQuery() {
  const client = useAppviewSandboxClient()
  const {currentAccount} = useSession()
  const viewer = currentAccount!.did

  return useInfiniteQuery({
    queryKey: createQueryKey(useAtmosphereRawQueryKeyRoot, {viewer}),
    queryFn: async ({pageParam}) => {
      const response = await client.call(eric.bsky.atmosphere.getActivityRaw, {
        cursor: pageParam,
      })
      const page = narrowActivityPage(response)
      return {
        ...page,
        feed: page.feed.filter(
          entry => entry.$type === 'eric.bsky.atmosphere.getActivity#item',
        ),
      }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.cursor,
    staleTime: STALE.SECONDS.FIFTEEN,
  })
}
