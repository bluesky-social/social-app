import Fuse from 'fuse.js'

import {
  type AutocompleteItem,
  type LocalSource,
} from '#/components/Autocomplete/types'

/** Max local matches pinned above remote results while typing. */
const MAX_PINNED = 3

/**
 * Merges local source items with remote typeahead results. An empty query
 * returns local items before remote results. A typed query fuse-matches over
 * local items and pins the top matches above remote results (source priority,
 * then fuse score, then source order and recency). Items are
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
  const priorities = new Map<string, number>()
  for (const source of [...sources].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  )) {
    for (const item of source.items) {
      if (seen.has(item.key)) continue
      seen.add(item.key)
      localItems.push(item)
      priorities.set(item.key, source.priority ?? 0)
    }
  }

  let localMatches = localItems
  const normalizedQuery = query.toLowerCase().trim().replace(/\.$/, '')
  if (normalizedQuery) {
    const fuse = new Fuse(localItems, {
      keys: ['value', 'profile.handle', 'profile.displayName'],
      threshold: 0.3,
      includeScore: true,
    })
    localMatches = fuse
      .search(normalizedQuery)
      .sort(
        (a, b) =>
          (priorities.get(b.item.key) ?? 0) -
            (priorities.get(a.item.key) ?? 0) ||
          (a.score ?? 0) - (b.score ?? 0) ||
          a.refIndex - b.refIndex,
      )
      .slice(0, MAX_PINNED)
      .map(result => result.item)
  }

  const remoteByKey = new Map(remoteItems.map(item => [item.key, item]))
  const localKeys = new Set(localMatches.map(item => item.key))

  return [
    ...localMatches.map(item => {
      const remote = remoteByKey.get(item.key)
      if (item.type === 'profile' && remote?.type === 'profile') {
        return {...item, value: remote.value, profile: remote.profile}
      }
      return item
    }),
    ...remoteItems.filter(item => !localKeys.has(item.key)),
  ]
}
