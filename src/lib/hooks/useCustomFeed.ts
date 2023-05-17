import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'

export function useCustomFeed(uri: string): CustomFeedModel | undefined {
  const store = useStores()
  const [item, setItem] = useState<CustomFeedModel | undefined>()
  useEffect(() => {
    async function fetchView() {
      const res = await store.agent.app.bsky.feed.getFeedGenerator({
        feed: uri,
      })
      const view = res.data.view
      return view
    }
    async function buildFeedItem() {
      const view = await fetchView()
      if (view) {
        const temp = new CustomFeedModel(store, view)
        setItem(temp)
      }
    }
    buildFeedItem()
  }, [store, uri])

  return item
}
