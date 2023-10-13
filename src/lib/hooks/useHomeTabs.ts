import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import isEqual from 'lodash.isequal'
import {FeedSourceModel} from 'state/models/content/feed-source'

export function useHomeTabs(uris: string[]): string[] {
  const store = useStores()
  const [tabs, setTabs] = useState<string[]>(['Following'])
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
      setTabs(['Following'].concat(models.map(f => f.displayName)))
      setLastUris(uris)
    }
    fetchFeedInfo()
  }, [store, uris, lastUris, setLastUris, setTabs])

  return tabs
}
