import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import isEqual from 'lodash.isequal'
import {AtUri} from '@atproto/api'

interface RightNavItem {
  uri: string
  href: string
  hostname: string
  collection: string
  rkey: string
  displayName: string
}

export function useDesktopRightNavItems(uris: string[]): RightNavItem[] {
  const store = useStores()
  const [items, setItems] = useState<RightNavItem[]>([])
  const [lastUris, setLastUris] = useState<string[]>([])

  useEffect(() => {
    if (isEqual(uris, lastUris)) {
      // no changes
      return
    }

    async function fetchFeedInfo() {
      const res = await store.agent.app.bsky.feed.getFeedGenerators({
        feeds: uris.slice(0, 25),
      })
      setItems(
        res.data.feeds.map(f => {
          const {hostname, collection, rkey} = new AtUri(f.uri)
          const href = `/profile/${hostname}/feed/${rkey}?view=simple`
          return {
            uri: f.uri,
            href,
            hostname,
            collection,
            rkey,
            displayName: f.displayName,
          }
        }),
      )
      setLastUris(uris)
    }
    fetchFeedInfo()
  }, [store, uris, lastUris, setLastUris, setItems])

  return items
}
