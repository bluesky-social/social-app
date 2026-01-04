import {useMemo, useState} from 'react'
import {useLingui} from '@lingui/react'

import {
  SETTINGS_SEARCH_ITEMS,
  type SettingsSearchContext,
  type SettingsSearchItem,
} from './settingsSearchConfig'

export type SettingsSearchResult = {
  item: SettingsSearchItem
  matchedKeywords: string[] // Keywords that matched (empty if title matched)
}

export function useSettingsSearch(ctx: SettingsSearchContext) {
  const {_} = useLingui()
  const [query, setQuery] = useState('')

  const filteredItems = useMemo((): SettingsSearchResult[] => {
    // Filter by visibility conditions first
    const visibleItems = SETTINGS_SEARCH_ITEMS.filter(
      item => !item.condition || item.condition(ctx),
    )

    // If no search query or only 1 character, return all visible items with no matched keywords
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2) {
      return visibleItems.map(item => ({item, matchedKeywords: []}))
    }

    const lowerQuery = trimmedQuery.toLowerCase()
    const results: SettingsSearchResult[] = []

    for (const item of visibleItems) {
      // Check title first
      const title = _(item.titleKey).toLowerCase()
      if (title.includes(lowerQuery)) {
        results.push({item, matchedKeywords: []})
        continue
      }

      // Check keywords - collect ALL matching keywords
      if (item.keywords) {
        const matchedKeywords: string[] = []
        for (const keyword of item.keywords) {
          const keywordText = _(keyword)
          if (keywordText.toLowerCase().includes(lowerQuery)) {
            matchedKeywords.push(keywordText)
          }
        }
        if (matchedKeywords.length > 0) {
          results.push({item, matchedKeywords})
        }
      }
    }

    return results
  }, [query, _, ctx])

  const clearQuery = () => setQuery('')

  return {
    query,
    setQuery,
    clearQuery,
    filteredItems,
    isSearching: query.trim().length >= 2,
    hasResults: filteredItems.length > 0,
  }
}

export type {SettingsSearchItem}
