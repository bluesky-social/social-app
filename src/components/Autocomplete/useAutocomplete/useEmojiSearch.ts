import {useCallback} from 'react'
import {type Emoji} from '@emoji-mart/data'
import Fuse from 'fuse.js'

import {useGetEmojis} from '#/lib/useGetEmojis'
import {type AutocompleteEmoji} from '#/components/Autocomplete/types'

/*
 * Lazily loaded Fuse instance for emoji search. Built once on first search,
 * then reused for all subsequent searches.
 */
let emojiFuseInstance: Fuse<Emoji> | null = null

export function useEmojiSearch(): (
  query: string,
  limit?: number,
) => Promise<AutocompleteEmoji[]> {
  const getEmojis = useGetEmojis()

  return useCallback(
    async (query: string, limit: number = 8) => {
      if (!emojiFuseInstance) {
        const data = await getEmojis()
        emojiFuseInstance = new Fuse(Object.values(data.emojis), {
          keys: ['search'],
          threshold: 0.3,
        })
      }

      const results = emojiFuseInstance.search(query, {limit})
      return results.map(result => ({
        key: result.item.id,
        type: 'emoji' as const,
        value: result.item.skins[0].native,
        emoji: result.item,
      }))
    },
    [getEmojis],
  )
}
