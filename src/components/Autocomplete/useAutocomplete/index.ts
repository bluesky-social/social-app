import {useCallback, useMemo} from 'react'
import {keepPreviousData, useQuery} from '@tanstack/react-query'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {
  type AutocompleteApi,
  type AutocompleteItem,
  type AutocompleteItemType,
  type LocalSource,
} from '#/components/Autocomplete/types'
import {mergeAutocompleteResults} from './mergeAutocompleteResults'
import {DEFAULT_MOD_OPTS, moderateProfileItem} from './moderation'
import {useEmojiSearch} from './useEmojiSearch'

export function useAutocomplete({
  type,
  query: q,
  limit,
  showSearchFallback = false,
  sources,
}: {
  type: AutocompleteItemType
  query: string
  limit?: number
  showSearchFallback?: boolean
  sources?: LocalSource[]
}): AutocompleteApi {
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const emojiSearch = useEmojiSearch()

  const query = useQuery({
    staleTime: STALE.MINUTES.ONE,
    queryKey: [
      'autocomplete',
      {
        type,
        query: q,
      },
    ],
    async queryFn() {
      if (type === 'profile') {
        if (!q) return []

        // Going from "foo" to "foo." should not clear matches.
        q = q.toLowerCase().trim().replace(/\.$/, '')

        const res = await agent.searchActorsTypeahead({
          q,
          limit: limit || 8,
        })

        return (res?.data.actors || []).map(profile => ({
          key: profile.did,
          type: 'profile' as const,
          value: '@' + profile.handle,
          profile,
        }))
      } else if (type === 'emoji') {
        return emojiSearch(q, limit || 8)
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
    const moderatedSources = sources?.map(source => ({
      ...source,
      items: source.items.filter(item => {
        if (item.type !== 'profile') return true
        return !!moderateProfileItem({
          query: q,
          item,
          moderationOpts: moderationOpts || DEFAULT_MOD_OPTS,
        })
      }),
    }))

    const results = mergeAutocompleteResults({
      query: q,
      sources: moderatedSources,
      remoteItems: query.data ?? [],
    })

    if (showSearchFallback && q) {
      results.unshift({
        key: `search-${q}`,
        type: 'search' as const,
        value: q,
      })
    }

    return limit ? results.slice(0, limit) : results
  }, [query.data, showSearchFallback, q, sources, moderationOpts, limit])

  return {
    query: q,
    items,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}
