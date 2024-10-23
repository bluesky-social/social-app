import React from 'react'
import Fuse from 'fuse.js'

import {useProfileFeedgensQuery} from '#/state/queries/profile-feedgens'
import {useSession} from '#/state/session'

export function useFeedsAutocomplete() {
  const {currentAccount} = useSession()
  const [query, setQuery] = React.useState('')

  const {data} = useProfileFeedgensQuery(currentAccount!.did)
  const allFeeds = React.useMemo(() => {
    return data?.pages?.flatMap(page => page.feeds) || []
  }, [data])

  const onSetQuery = React.useCallback(
    (query: string) => {
      setQuery(query)
    },
    [setQuery],
  )

  const suggestions = React.useMemo(() => {
    const items = allFeeds
    const fuse = new Fuse(items, {
      keys: ['displayName', 'description'],
    })
    // search amongst mixed set of tags
    const results = fuse.search(query).map(r => r.item)
    return results
  }, [query, allFeeds])

  return {
    query,
    feeds: allFeeds,
    suggestions,
    setQuery: onSetQuery,
  }
}
