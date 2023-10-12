import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import isEqual from 'lodash.isequal'

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
      const res = await store.agent.app.bsky.feed.getFeedGenerators({
        feeds: uris.slice(0, 25),
      })
      setTabs(['Following'].concat(res.data.feeds.map(f => f.displayName)))
      setLastUris(uris)
    }
    fetchFeedInfo()
  }, [store, uris, lastUris, setLastUris, setTabs])

  return tabs
}
