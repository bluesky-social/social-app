import {useEffect, useState} from 'react'
import {useStores} from 'state/index'
import {FeedSourceModel} from 'state/models/content/feed-source'

export function useCustomFeed(uri: string): FeedSourceModel | undefined {
  const store = useStores()
  const [item, setItem] = useState<FeedSourceModel | undefined>()
  useEffect(() => {
    async function buildFeedItem() {
      const model = new FeedSourceModel(store, uri)
      await model.setup()
      setItem(model)
    }
    buildFeedItem()
  }, [store, uri])

  return item
}
