import {useCallback, useMemo} from 'react'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {keepPreviousData, useQuery} from '@tanstack/react-query'

import {useDebouncedValue} from '#/lib/hooks/useDebouncedValue'
import {isJustAMute, moduiContainsHideableOffense} from '#/lib/moderation'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {DEFAULT_LOGGED_OUT_PREFERENCES} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'
import {
  type AutocompleteApi,
  type AutocompleteItem,
  type AutocompleteItemType,
  type AutocompleteProfile,
} from '#/components/Autocomplete/types'
import {useEmojiSearch} from './useEmojiSearch'

const QUERY_DEBOUNCE_MS = 150

const DEFAULT_MOD_OPTS = {
  userDid: undefined,
  prefs: DEFAULT_LOGGED_OUT_PREFERENCES.moderationPrefs,
}

export function useAutocomplete({
  type,
  query: q,
  limit,
  showSearchFallback = false,
}: {
  type: AutocompleteItemType
  query: string
  limit?: number
  showSearchFallback?: boolean
}): AutocompleteApi {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const emojiSearch = useEmojiSearch()
  // Debounce the value that drives the network request, so we don't refetch
  // and re-render the dropdown on every keystroke. Live `q` is still used in
  // `select` below for the search-fallback row so it tracks the input.
  const debouncedQ = useDebouncedValue(q, QUERY_DEBOUNCE_MS)

  const query = useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: [
      'autocomplete',
      {
        type,
        query: debouncedQ,
      },
    ],
    async queryFn() {
      if (type === 'profile') {
        // TODO return recents
        if (!debouncedQ) return []

        // Going from "foo" to "foo." should not clear matches.
        const normalized = debouncedQ.toLowerCase().trim().replace(/\.$/, '')

        const res = await agent.searchActorsTypeahead({
          q: normalized,
          limit: limit || 8,
        })

        return (res?.data.actors || []).map(profile => ({
          key: profile.did,
          type: 'profile' as const,
          value: '@' + profile.handle,
          profile,
        }))
      } else if (type === 'emoji') {
        return emojiSearch(debouncedQ, limit || 8)
      }

      return []
    },
    select: useCallback(
      (items: AutocompleteItem[]) => {
        const seen = new Set<string>()
        let results: AutocompleteItem[] = []

        for (const item of items) {
          if (seen.has(item.key)) continue
          seen.add(item.key)

          if (item.type === 'profile') {
            const moderated = moderateProfileItem({
              query: q,
              item,
              moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
            })
            if (moderated) results.push(moderated)
          } else {
            results.push(item)
          }
        }

        return results
      },
      [q, moderationOpts],
    ),
    placeholderData: keepPreviousData,
  })

  const items = useMemo(() => {
    if (!query.data) {
      return []
    }

    const results = [...query.data]

    if (showSearchFallback && q) {
      results.unshift({
        key: `search-${q}`,
        type: 'search' as const,
        value: q,
      })
    }

    return results
  }, [query.data, showSearchFallback, q])

  return {
    query: q,
    items,
    isFetching: query.isFetching,
  }
}

function moderateProfileItem({
  query,
  item,
  moderationOpts,
}: {
  query: string
  item: AutocompleteProfile
  moderationOpts: ModerationOpts
}) {
  const modui = moderateProfile(item.profile, moderationOpts).ui('profileList')
  const isExactMatch = query && item.profile.handle.toLowerCase() === query

  if (
    (isExactMatch && !moduiContainsHideableOffense(modui)) ||
    !modui.filter ||
    isJustAMute(modui)
  ) {
    return item
  }

  return null
}
