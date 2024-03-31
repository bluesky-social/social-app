import React from 'react'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {useQuery, useQueryClient} from '@tanstack/react-query'

import {isJustAMute} from '#/lib/moderation'
import {isInvalidHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useMyFollowsQuery} from '#/state/queries/my-follows'
import {getAgent} from '#/state/session'
import {DEFAULT_LOGGED_OUT_PREFERENCES, useModerationOpts} from './preferences'

const DEFAULT_MOD_OPTS = {
  userDid: undefined,
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
}

export const RQKEY = (prefix: string) => ['actor-autocomplete', prefix]

export function useActorAutocompleteQuery(prefix: string) {
  const {data: follows, isFetching} = useMyFollowsQuery()
  const moderationOpts = useModerationOpts()

  prefix = prefix.toLowerCase()

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
      query = query.toLowerCase()
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
            message: e,
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
      items.push(item)
    }
  }
  return items.filter(profile => {
    const modui = moderateProfile(profile, moderationOpts).ui('profileList')
    return !modui.filter || isJustAMute(modui)
  })
}

function prefixMatch(
  prefix: string,
  info: AppBskyActorDefs.ProfileViewBasic,
): boolean {
  if (!isInvalidHandle(info.handle) && info.handle.includes(prefix)) {
    return true
  }
  if (info.displayName?.toLocaleLowerCase().includes(prefix)) {
    return true
  }
  return false
}
