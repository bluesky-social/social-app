import React from 'react'
import {
  type AppBskyActorDefs,
  moderateProfile,
  type ModerationOpts,
} from '@atproto/api'
import {keepPreviousData, useQuery, useQueryClient} from '@tanstack/react-query'

import {isJustAMute, moduiContainsHideableOffense} from '#/lib/moderation'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from './preferences'

const RQKEY_ROOT = 'actor-autocomplete'
export const RQKEY = (prefix: string) => [RQKEY_ROOT, prefix]

export function useActorAutocompleteQuery(
  prefix: string,
  maintainData?: boolean,
  limit?: number,
) {
  const moderationOpts = useModerationOpts()
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

  prefix = prefix.toLowerCase().trim()
  if (prefix.endsWith('.')) {
    // Going from "foo" to "foo." should not clear matches.
    prefix = prefix.slice(0, -1)
  }

  return useQuery<AppBskyActorDefs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = prefix
        ? await agent.searchActorsTypeahead({
            q: prefix,
            limit: limit || 8,
          })
        : undefined
      return res?.data.actors || []
    },
    select: React.useCallback(
      (data: AppBskyActorDefs.ProfileViewBasic[]) => {
        return computeSuggestions({
          q: prefix,
          searched: data,
          moderationOpts: moderationOpts || {
            userDid: undefined,
            prefs:
              preferences?.moderationPrefs ||
              DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
          },
        })
      },
      [prefix, moderationOpts, preferences],
    ),
    placeholderData: maintainData ? keepPreviousData : undefined,
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()
  const agent = useAgent()
  const {data: preferences} = usePreferencesQuery()

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
              agent.searchActorsTypeahead({
                q: query,
                limit,
              }),
          })
        } catch (e) {
          logger.error('useActorSearch: searchActorsTypeahead failed', {
            message: e,
          })
        }
      }

      return computeSuggestions({
        q: query,
        searched: res?.data.actors,
        moderationOpts: moderationOpts || {
          userDid: undefined,
          prefs:
            preferences?.moderationPrefs ||
            DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
        },
      })
    },
    [queryClient, moderationOpts, agent, preferences],
  )
}

function computeSuggestions({
  q,
  searched = [],
  moderationOpts,
}: {
  q?: string
  searched?: AppBskyActorDefs.ProfileViewBasic[]
  moderationOpts: ModerationOpts
}) {
  let items: AppBskyActorDefs.ProfileViewBasic[] = []
  for (const item of searched) {
    if (!items.find(item2 => item2.handle === item.handle)) {
      items.push(item)
    }
  }
  return items.filter(profile => {
    const modui = moderateProfile(profile, moderationOpts).ui('profileList')
    const isExactMatch = q && profile.handle.toLowerCase() === q
    return (
      (isExactMatch && !moduiContainsHideableOffense(modui)) ||
      !modui.filter ||
      isJustAMute(modui)
    )
  })
}
