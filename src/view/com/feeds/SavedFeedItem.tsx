import React from 'react'
import {View, TouchableOpacity, StyleSheet} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {SavedFeedsModel} from 'state/models/ui/saved-feeds'
import {CustomFeed} from './CustomFeed'

export const SavedFeedItem = observer(
  ({
    item,
    savedFeeds,
  }: {
    item: CustomFeedModel
    savedFeeds: SavedFeedsModel
  }) => {
    const isPinned = savedFeeds.isPinned(item)

    return (
      <View style={styles.itemContainer}>
        <CustomFeed key={item.data.uri} item={item} style={styles.item} />
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            savedFeeds.togglePinnedFeed(item)
            console.log('pinned', savedFeeds.pinned)
            console.log('isPinned', savedFeeds.isPinned(item))
          }}>
          <FontAwesomeIcon
            icon="thumb-tack"
            size={20}
            color={isPinned ? colors.blue3 : colors.gray3}
          />
        </TouchableOpacity>
      </View>
    )
  },
)

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  item: {
    borderTopWidth: 0,
  },
})
