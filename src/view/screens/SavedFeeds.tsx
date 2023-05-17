import React, {useCallback, useMemo} from 'react'
import {
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb, isWeb} from 'platform/detection'
import {s} from 'lib/styles'
import {SavedFeedsModel} from 'state/models/feeds/algo/saved'
import {Link} from 'view/com/util/Link'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {SavedFeedItem} from 'view/com/algos/SavedFeedItem'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>

export const SavedFeeds = withAuthRequired(
  observer(({navigation}: Props) => {
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
          ListHeaderComponent={() => (
            <ListHeaderComponent
              savedFeeds={savedFeeds}
              navigation={navigation}
            />
          )}
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

const ListHeaderComponent = observer(
  ({
    savedFeeds,
    navigation,
  }: {
    savedFeeds: SavedFeedsModel
    navigation: Props['navigation']
  }) => {
    const pal = usePalette('default')
    return (
      <View style={styles.headerContainer}>
        {savedFeeds.pinned.length > 0 ? (
          <View style={styles.pinnedContainer}>
            <View style={styles.pinnedHeader}>
              <Text type="lg-bold" style={[pal.text]}>
                Pinned Feeds
              </Text>
              <Link href="/settings/pinned-feeds">
                <Text style={[styles.editPinned, pal.text]}>Edit</Text>
              </Link>
            </View>

            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={isWeb}>
              {savedFeeds.pinned.map(item => {
                return (
                  <TouchableOpacity
                    key={item.data.uri}
                    accessibilityRole="button"
                    onPress={() => {
                      navigation.navigate('CustomFeed', {
                        rkey: item.data.uri,
                        name: item.data.displayName,
                      })
                    }}
                    style={styles.pinnedItem}>
                    <UserAvatar avatar={item.data.avatar} size={80} />
                    <Text
                      type="sm-medium"
                      numberOfLines={1}
                      style={[pal.text, styles.pinnedItemName]}>
                      {item.data.displayName ??
                        `${item.data.creator.displayName}'s feed`}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        ) : null}

        <Text type="lg-bold">All Saved Feeds</Text>
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
  headerContainer: {paddingHorizontal: 18, paddingTop: 18},
  pinnedContainer: {marginBottom: 18, gap: 18},
  pinnedHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  pinnedItem: {
    flex: 1,
    alignItems: 'center',
    marginRight: 18,
    maxWidth: 100,
  },
  pinnedItemName: {marginTop: 8, textAlign: 'center'},
  editPinned: {textDecorationLine: 'underline'},
})
