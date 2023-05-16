import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import {AlgoItemModel} from 'state/models/feeds/algo/algo-item'

export function useCustomFeed(uri: string) {
  const store = useStores()
  const [item, setItem] = useState<AlgoItemModel>()
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
        const temp = new AlgoItemModel(store, view)
        setItem(temp)
      }
    }
    buildFeedItem()
  }, [store, uri])

  return item
}
