import React from 'react'
import Fuse from 'fuse.js'

import {useSession} from '#/state/session'
import {account} from '#/storage'

export type Result = {
  value: string
}

export type Model = {
  readonly suggestions: Result[]
  setQuery(query: string): void
  save(tag: string): void
}

export function useTagAutocomplete() {
  const {currentAccount} = useSession()
  const [query, setQuery] = React.useState('')
  const [searchSuggestions, setSearchSuggestions] = React.useState<Result[]>([])

  const search = React.useCallback(
    async (_query: string) => {
      // TODO actually search
      // TODO debounce/abort controller
      setSearchSuggestions([])
    },
    [setSearchSuggestions],
  )

  const onSetQuery = React.useCallback(
    (query: string) => {
      setQuery(query)
      search(query)
    },
    [setQuery, search],
  )

  const saveRecentTag = React.useCallback(
    (tag: string) => {
      if (!currentAccount) {
        throw new Error('No current account')
      }
      const recentTags = account.get([currentAccount.did, 'recentTags']) || []
      account.set(
        [currentAccount.did, 'recentTags'],
        [{value: tag}, ...recentTags.filter(t => t.value !== tag)].slice(0, 40),
      )
    },
    [currentAccount],
  )

  const suggestions: Result[] = React.useMemo(() => {
    if (!currentAccount) {
      throw new Error('No current account')
    }
    const recentTags = account.get([currentAccount.did, 'recentTags']) || []
    const items = [
      ...recentTags.map(t => t.value),
      ...searchSuggestions.map(s => s.value),
    ]
    const fuse = new Fuse(items)
    // search amongst mixed set of tags
    const results = fuse.search(query).map(r => r.item)
    return results.map(value => ({value}))
  }, [currentAccount, query, searchSuggestions])

  return {
    suggestions,
    setQuery: onSetQuery,
    saveRecentTag,
  }
}
