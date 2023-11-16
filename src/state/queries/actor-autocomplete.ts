import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {STALE} from '#/state/queries'

export const RQKEY = (prefix: string) => ['actor-autocomplete', prefix]

export function useActorAutocompleteQuery(prefix: string) {
  const {agent} = useSession()
  const {data: follows, isFetching} = useMyFollowsQuery()

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = prefix
        ? await agent.searchActorsTypeahead({
            term: prefix,
            limit: 8,
          })
        : undefined
      return computeSuggestions(prefix, follows, res?.data.actors)
    },
    enabled: !isFetching,
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient()
  const {agent} = useSession()
  const {data: follows} = useMyFollowsQuery()

  return React.useCallback(
    async ({query, limit = 8}: {query: string; limit?: number}) => {
      let res
      if (query) {
        try {
          res = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE,
            queryKey: RQKEY(query || ''),
            queryFn: () =>
              agent.searchActorsTypeahead({
                term: query,
                limit,
              }),
          })
        } catch (e) {
          logger.error('useActorSearch: searchActorsTypeahead failed', {
            error: e,
          })
        }
      }

      return computeSuggestions(query, follows, res?.data.actors)
    },
    [agent, follows, queryClient],
  )
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
