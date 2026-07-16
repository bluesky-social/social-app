import {useCallback} from 'react'
import {moderateProfile, type ModerationOpts} from '@bsky.app/sdk/moderation'
import {keepPreviousData, useQuery, useQueryClient} from '@tanstack/react-query'

import {isJustAMute, moduiContainsHideableOffense} from '#/lib/moderation'
import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useAppviewClient} from '#/state/session'
import {app} from '#/lexicons'
import {useModerationOpts} from '../preferences/moderation-opts'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from './preferences'

const DEFAULT_MOD_OPTS = {
  userDid: undefined,
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
}

const RQKEY_ROOT = 'actor-autocomplete'
export const RQKEY = (prefix: string) => [RQKEY_ROOT, prefix]

export function useActorAutocompleteQuery(
  prefix: string,
  maintainData?: boolean,
  limit?: number,
) {
  const moderationOpts = useModerationOpts()
  const client = useAppviewClient()

  prefix = prefix.toLowerCase().trim()
  if (prefix.endsWith('.')) {
    // Going from "foo" to "foo." should not clear matches.
    prefix = prefix.slice(0, -1)
  }

  return useQuery<app.bsky.actor.defs.ProfileViewBasic[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: RQKEY(prefix || ''),
    async queryFn() {
      const res = prefix
        ? await client.call(app.bsky.actor.searchActorsTypeahead, {
            q: prefix,
            limit: limit || 8,
          })
        : undefined
      return res?.actors || []
    },
    select: useCallback(
      (data: app.bsky.actor.defs.ProfileViewBasic[]) => {
        return computeSuggestions({
          q: prefix,
          searched: data,
          moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
        })
      },
      [prefix, moderationOpts],
    ),
    placeholderData: maintainData ? keepPreviousData : undefined,
  })
}

export type ActorAutocompleteFn = ReturnType<typeof useActorAutocompleteFn>
export function useActorAutocompleteFn() {
  const queryClient = useQueryClient()
  const moderationOpts = useModerationOpts()
  const client = useAppviewClient()

  return useCallback(
    async ({query, limit = 8}: {query: string; limit?: number}) => {
      query = query.toLowerCase()
      let res
      if (query) {
        try {
          res = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE,
            queryKey: RQKEY(query || ''),
            queryFn: () =>
              client.call(app.bsky.actor.searchActorsTypeahead, {
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
        searched: res?.actors,
        moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
      })
    },
    [queryClient, moderationOpts, client],
  )
}

function computeSuggestions({
  q,
  searched = [],
  moderationOpts,
}: {
  q?: string
  searched?: app.bsky.actor.defs.ProfileViewBasic[]
  moderationOpts: ModerationOpts
}) {
  let items: app.bsky.actor.defs.ProfileViewBasic[] = []
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
