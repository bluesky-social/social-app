import {useQuery, useQueryClient, UseQueryResult} from '@tanstack/react-query'
import {AtUri, AppBskyActorDefs} from '@atproto/api'

import {profileBasicQueryKey as RQKEY_PROFILE_BASIC} from './profile'
import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

export const RQKEY = (didOrHandle: string) => ['resolved-did', didOrHandle]

type UriUseQueryResult = UseQueryResult<{did: string; uri: string}, Error>
export function useResolveUriQuery(uri: string | undefined): UriUseQueryResult {
  const urip = new AtUri(uri || '')
  const res = useResolveDidQuery(urip.host)
  if (res.data) {
    urip.host = res.data
    return {
      ...res,
      data: {did: urip.host, uri: urip.toString()},
    } as UriUseQueryResult
  }
  return res as UriUseQueryResult
}

export function useResolveDidQuery(didOrHandle: string | undefined) {
  const queryClient = useQueryClient()

  return useQuery<string, Error>({
    staleTime: STALE.HOURS.ONE,
    queryKey: RQKEY(didOrHandle ?? ''),
    queryFn: async () => {
      if (!didOrHandle) return ''
      // Just return the did if it's already one
      if (didOrHandle.startsWith('did:')) return didOrHandle

      const res = await getAgent().resolveHandle({handle: didOrHandle})
      return res.data.did
    },
    initialData: () => {
      // Return undefined if no did or handle
      if (!didOrHandle) return

      const profile =
        queryClient.getQueryData<AppBskyActorDefs.ProfileViewBasic>(
          RQKEY_PROFILE_BASIC(didOrHandle),
        )
      return profile?.did
    },
    enabled: !!didOrHandle,
  })
}
