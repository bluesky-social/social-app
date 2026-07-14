import {useCallback} from 'react'
import {useQueryClient} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {
  type AutocompleteItem,
  type AutocompleteItemType,
  type LocalSource,
} from '#/components/Autocomplete/types'
import {mergeAutocompleteResults} from './mergeAutocompleteResults'
import {DEFAULT_MOD_OPTS, moderateProfileItem} from './moderation'
import {useEmojiSearch} from './useEmojiSearch'

/**
 * Imperative variant of useAutocomplete for callers that cannot re-render
 * per keystroke (e.g. the tiptap mention suggestion plugin). Shares the
 * same query cache, merge, and moderation pipeline.
 */
export function useAutocompleteFn({
  type,
  sources,
}: {
  type: AutocompleteItemType
  sources?: LocalSource[]
}) {
  const queryClient = useQueryClient()
  const agent = useAgent()
  const moderationOpts = useModerationOpts()
  const emojiSearch = useEmojiSearch()

  return useCallback(
    async (query: string, limit: number = 8): Promise<AutocompleteItem[]> => {
      let remoteItems: AutocompleteItem[] = []

      if (type === 'profile' && query) {
        try {
          remoteItems = await queryClient.fetchQuery({
            staleTime: STALE.MINUTES.ONE,
            queryKey: ['autocomplete', {type, query}],
            async queryFn() {
              // Going from "foo" to "foo." should not clear matches.
              const q = query.toLowerCase().trim().replace(/\.$/, '')
              const res = await agent.searchActorsTypeahead({q, limit})
              return (res?.data.actors || []).map(profile => ({
                key: profile.did,
                type: 'profile' as const,
                value: '@' + profile.handle,
                profile,
              }))
            },
          })
        } catch (e) {
          logger.error('useAutocompleteFn: searchActorsTypeahead failed', {
            message: e,
          })
        }
      } else if (type === 'emoji' && query) {
        remoteItems = await emojiSearch(query, limit)
      }

      // Match the hook's select: dedupe remote items by key.
      const seen = new Set<string>()
      remoteItems = remoteItems.filter(item => {
        if (seen.has(item.key)) return false
        seen.add(item.key)
        return true
      })

      const opts = moderationOpts || DEFAULT_MOD_OPTS
      const moderate = (items: AutocompleteItem[]) =>
        items.filter(item => {
          if (item.type !== 'profile') return true
          return !!moderateProfileItem({query, item, moderationOpts: opts})
        })

      const moderatedSources = sources?.map(source => ({
        ...source,
        items: moderate(source.items),
      }))

      const results = mergeAutocompleteResults({
        query,
        sources: moderatedSources,
        remoteItems: moderate(remoteItems),
      })

      return results.slice(0, limit)
    },
    [type, sources, queryClient, agent, moderationOpts, emojiSearch],
  )
}
