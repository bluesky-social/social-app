import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import isEqual from 'lodash.isequal'
import {AtUri} from '@atproto/api'
import {FeedSourceModel} from 'state/models/content/feed-source'

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
      const models = uris
        .slice(0, 25)
        .map(uri => new FeedSourceModel(store, uri))
      await Promise.all(models.map(m => m.setup()))
      setItems(
        models.map(model => {
          const {hostname, collection, rkey} = new AtUri(model.uri)
          return {
            uri: model.uri,
            href: model.href,
            hostname,
            collection,
            rkey,
            displayName: model.displayName,
          }
        }),
      )
      setLastUris(uris)
    }
    fetchFeedInfo()
  }, [store, uris, lastUris, setLastUris, setItems])

  return items
}
