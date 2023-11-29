import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {
  useQuery,
  useQueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'

import {logger} from '#/logger'
import {getAgent} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {STALE} from '#/state/queries'

export const RQKEY = (prefix: string, limit = 8) =>
  ['actor-autocomplete', prefix, limit] as [string, string, number]

interface ActorAutocompleteQueryMeta {
  follows: AppBskyActorDefs.ProfileViewBasic[] | undefined
}
export function useActorAutocompleteQuery(prefix: string) {
  const {data: follows, isFetching} = useMyFollowsQuery()

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    queryFn: actorAutoCompleteQueryFn,
    meta: {follows},
    enabled: !isFetching,
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient()
  const {data: follows} = useMyFollowsQuery()

  return React.useCallback(
    async ({query, limit = 8}: {query: string; limit?: number}) => {
      let res
      if (query) {
        try {
          res = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE,
            queryKey: RQKEY(query || '', limit),
            meta: {follows},
            queryFn: actorAutoCompleteQueryFn,
          })
        } catch (e) {
          logger.error('useActorSearch: searchActorsTypeahead failed', {
            error: e,
          })
        }
      }
      return res
    },
    [follows, queryClient],
  )
}

async function actorAutoCompleteQueryFn({
  queryKey,
  meta,
}: QueryFunctionContext) {
  const [_, prefix, limit] = queryKey as ReturnType<typeof RQKEY>
  const {follows} = meta as any as ActorAutocompleteQueryMeta
  const res = prefix
    ? await getAgent().searchActorsTypeahead({
        term: prefix,
        limit,
      })
    : undefined
  return computeSuggestions(prefix, follows, res?.data.actors)
}

function computeSuggestions(
  prefix: string,
  follows: AppBskyActorDefs.ProfileViewBasic[] | undefined,
  searched: AppBskyActorDefs.ProfileViewBasic[] = [],
) {
  let items: AppBskyActorDefs.ProfileViewBasic[] = []
  if (follows) {
    items = follows.filter(follow => prefixMatch(prefix, follow)).slice(0, 8)
  }
  for (const item of searched) {
    if (!items.find(item2 => item2.handle === item.handle)) {
      items.push({
        did: item.did,
        handle: item.handle,
        displayName: item.displayName,
        avatar: item.avatar,
      })
    }
  }
  return items
}

function prefixMatch(
  prefix: string,
  info: AppBskyActorDefs.ProfileViewBasic,
): boolean {
  if (info.handle.includes(prefix)) {
    return true
  }
  if (info.displayName?.toLocaleLowerCase().includes(prefix)) {
    return true
  }
  return false
}
