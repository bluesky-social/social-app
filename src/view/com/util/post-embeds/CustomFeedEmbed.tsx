import React, {useMemo} from 'react'
import {AppBskyFeedDefs} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet} from 'react-native'
import {useStores} from 'state/index'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'

export function CustomFeedEmbed({
  record,
}: {
  record: AppBskyFeedDefs.GeneratorView
}) {
  const pal = usePalette('default')
  const store = useStores()
  const item = useMemo(() => {
    const model = new FeedSourceModel(store, record.uri)
    model.hydrateFeedGenerator(record)
    return model
  }, [store, record])
  return (
    <FeedSourceCard
      item={item}
      style={[pal.view, pal.border, styles.customFeedOuter]}
      showLikes
    />
  )
}

const styles = StyleSheet.create({
  customFeedOuter: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
})
