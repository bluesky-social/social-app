import React, {useCallback, useMemo} from 'react'
import {
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import AlgoItem from 'view/com/algos/AlgoItem'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {colors, s} from 'lib/styles'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AlgoItemModel} from 'state/models/feeds/algo/algo-item'
import {SavedFeedsModel} from 'state/models/feeds/algo/saved'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>

export const SavedFeeds = withAuthRequired(
  observer(({}: Props) => {
    // hooks for global items
    const pal = usePalette('default')
    const rootStore = useStores()
    const {screen} = useAnalytics()

    // hooks for local
    const savedFeeds = useMemo(() => rootStore.me.savedFeeds, [rootStore])
    useFocusEffect(
      useCallback(() => {
        screen('SavedFeeds')
        rootStore.shell.setMinimalShellMode(false)
        savedFeeds.refresh()
      }, [screen, rootStore, savedFeeds]),
    )
    const _ListEmptyComponent = () => {
      return (
        <View
          style={[
            pal.border,
            !isDesktopWeb && s.flex1,
            pal.viewLight,
            styles.empty,
          ]}>
          <Text type="lg" style={[pal.text]}>
            You don't have any saved feeds. To save a feed, click the save
            button when a custom feed or algorithm shows up.
          </Text>
        </View>
      )
    }
    const _ListFooterComponent = () => {
      return (
        <View style={styles.footer}>
          {savedFeeds.isLoading && <ActivityIndicator />}
        </View>
      )
    }

    return (
      <CenteredView style={[s.flex1]}>
        <ViewHeader title="Saved Feeds" showOnDesktop />
        <FlatList
          style={[!isDesktopWeb && s.flex1]}
          data={savedFeeds.feeds}
          keyExtractor={item => item.data.uri}
          refreshing={savedFeeds.isRefreshing}
          refreshControl={
            <RefreshControl
              refreshing={savedFeeds.isRefreshing}
              onRefresh={() => savedFeeds.refresh()}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={({item}) => (
            <SavedFeedItem item={item} savedFeeds={savedFeeds} />
          )}
          initialNumToRender={10}
          ListFooterComponent={_ListFooterComponent}
          ListEmptyComponent={_ListEmptyComponent}
          extraData={savedFeeds.isLoading}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      </CenteredView>
    )
  }),
)

const SavedFeedItem = observer(
  ({item, savedFeeds}: {item: AlgoItemModel; savedFeeds: SavedFeedsModel}) => {
    const isPinned = savedFeeds.isPinned(item)

    return (
      <View style={styles.itemContainer}>
        <AlgoItem
          key={item.data.uri}
          item={item}
          showBottom={false}
          style={styles.item}
        />
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
  footer: {
    paddingVertical: 20,
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  item: {
    borderTopWidth: 0,
  },
})
