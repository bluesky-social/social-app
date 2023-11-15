import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'

export const RQKEY = (prefix: string) => ['actor-autocomplete', prefix]

export function useActorAutocompleteQuery(prefix: string) {
  const {agent} = useSession()
  const {data: follows, isFetching} = useMyFollowsQuery()

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    // cached for 1 min
    staleTime: 60 * 1000,
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
    async ({query}: {query: string}) => {
      let res
      if (query) {
        try {
          res = await queryClient.fetchQuery({
            // cached for 1 min
            staleTime: 60 * 1000,
            queryKey: RQKEY(query || ''),
            queryFn: () =>
              agent.searchActorsTypeahead({
                term: query,
                limit: 8,
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
