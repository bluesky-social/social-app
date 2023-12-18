import React from 'react'
import {AppBskyActorDefs, ModerationOpts, moderateProfile} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {getAgent} from '#/state/session'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {STALE} from '#/state/queries'
import {
  DEFAULT_LOGGED_OUT_PREFERENCES,
  getModerationOpts,
  useModerationOpts,
} from './preferences'

const DEFAULT_MOD_OPTS = getModerationOpts({
  userDid: '',
  preferences: DEFAULT_LOGGED_OUT_PREFERENCES,
})

export const RQKEY = (prefix: string) => ['actor-autocomplete', prefix]

export function useActorAutocompleteQuery(prefix: string) {
  const {data: follows, isFetching} = useMyFollowsQuery()
  const moderationOpts = useModerationOpts()

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = prefix
        ? await getAgent().searchActorsTypeahead({
            term: prefix,
            limit: 8,
          })
        : undefined
      return res?.data.actors || []
    },
    enabled: !isFetching,
    select: React.useCallback(
      (data: AppBskyActorDefs.ProfileViewBasic[]) => {
        return computeSuggestions(
          prefix,
          follows,
          data,
          moderationOpts || DEFAULT_MOD_OPTS,
        )
      },
      [prefix, follows, moderationOpts],
    ),
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient()
  const {data: follows} = useMyFollowsQuery()
  const moderationOpts = useModerationOpts()

  return React.useCallback(
    async ({query, limit = 8}: {query: string; limit?: number}) => {
      let res
      if (query) {
        try {
          res = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE,
            queryKey: RQKEY(query || ''),
            queryFn: () =>
              getAgent().searchActorsTypeahead({
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

      return computeSuggestions(
        query,
        follows,
        res?.data.actors,
        moderationOpts || DEFAULT_MOD_OPTS,
      )
    },
    [follows, queryClient, moderationOpts],
  )
}

function computeSuggestions(
  prefix: string,
  follows: AppBskyActorDefs.ProfileViewBasic[] | undefined,
  searched: AppBskyActorDefs.ProfileViewBasic[] = [],
  moderationOpts: ModerationOpts,
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
        labels: item.labels,
      })
    }
  }
  return items.filter(profile => {
    const mod = moderateProfile(profile, moderationOpts)
    return !mod.account.filter
  })
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
