import Fuse from 'fuse.js'

import {
  type AutocompleteItem,
  type LocalSource,
} from '#/components/Autocomplete/types'

/** Max local matches pinned above remote results while typing. */
const MAX_PINNED = 3

/**
 * Merges local source items with remote typeahead results. An empty query
 * returns local items only, in source order. A typed query fuse-matches over
 * local items and pins the top matches above remote results (fuse score,
 * tie-broken by insertion order, i.e. source order then recency). Items are
 * deduped by key; a pinned local profile adopts the fresher remote profile
 * data when the same account also appears in remote results.
 */
export function mergeAutocompleteResults({
  query,
  sources = [],
  remoteItems = [],
}: {
  query: string
  sources?: LocalSource[]
  remoteItems?: AutocompleteItem[]
}): AutocompleteItem[] {
  const seen = new Set<string>()
  const localItems: AutocompleteItem[] = []
  for (const source of sources) {
    for (const item of source.items) {
      if (seen.has(item.key)) continue
      seen.add(item.key)
      localItems.push(item)
    }
  }

  let localMatches = localItems
  if (query) {
    const fuse = new Fuse(localItems, {
      keys: ['value', 'profile.handle', 'profile.displayName'],
      threshold: 0.3,
    })
    localMatches = fuse
      .search(query, {limit: MAX_PINNED})
      .map(result => result.item)
  }

  const remoteByKey = new Map(remoteItems.map(item => [item.key, item]))
  const localKeys = new Set(localMatches.map(item => item.key))

  return [
    ...localMatches.map(item => {
      const remote = remoteByKey.get(item.key)
      if (item.type === 'profile' && remote?.type === 'profile') {
        return {...item, profile: remote.profile}
      }
      return item
    }),
    ...remoteItems.filter(item => !localKeys.has(item.key)),
  ]
}
