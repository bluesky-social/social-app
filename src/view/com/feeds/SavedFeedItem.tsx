import React, {useCallback} from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {colors} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {SavedFeedsModel} from 'state/models/ui/saved-feeds'
import {CustomFeed} from './CustomFeed'
import {usePalette} from 'lib/hooks/usePalette'

export const SavedFeedItem = observer(
  ({
    item,
    savedFeeds,
    showSaveBtn = false,
    style,
  }: {
    item: CustomFeedModel
    savedFeeds: SavedFeedsModel
    showSaveBtn?: boolean
    style?: StyleProp<ViewStyle>
  }) => {
    const pal = usePalette('default')
    const isPinned = savedFeeds.isPinned(item)
    const onTogglePinned = useCallback(
      () => savedFeeds.togglePinnedFeed(item),
      [savedFeeds, item],
    )

    return (
      <View style={[styles.itemContainer, style]}>
        <CustomFeed
          key={item.data.uri}
          item={item}
          showSaveBtn={showSaveBtn}
          style={styles.noBorder}
        />
        <TouchableOpacity accessibilityRole="button" onPress={onTogglePinned}>
          <FontAwesomeIcon
            icon="thumb-tack"
            size={20}
            color={isPinned ? colors.blue3 : pal.colors.icon}
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
  noBorder: {
    borderTopWidth: 0,
  },
})
