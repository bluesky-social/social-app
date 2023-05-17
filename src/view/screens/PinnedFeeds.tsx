import React, {useCallback, useMemo} from 'react'
import {
  RefreshControl,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
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
import {isDesktopWeb} from 'platform/detection'
import {s} from 'lib/styles'
import DraggableFlatList, {
  ShadowDecorator,
  ScaleDecorator,
} from 'react-native-draggable-flatlist'
import {SavedFeedItem} from 'view/com/algos/SavedFeedItem'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PinnedFeeds'>

export const PinnedFeeds = withAuthRequired(
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
            You don't have any pinned feeds. To pin a feed, go back to the Saved
            Feeds screen and click the pin icon!
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
        <ViewHeader title="Arrange Pinned Feeds" showOnDesktop />
        <DraggableFlatList
          containerStyle={[!isDesktopWeb && s.flex1]}
          data={savedFeeds.pinned}
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
          renderItem={({item, drag}) => (
            <ScaleDecorator>
              <ShadowDecorator>
                <Pressable
                  accessibilityRole="button"
                  onLongPress={drag}
                  style={styles.itemContainer}>
                  <FontAwesomeIcon icon="bars" size={20} style={styles.icon} />
                  <SavedFeedItem item={item} savedFeeds={savedFeeds} />
                </Pressable>
              </ShadowDecorator>
            </ScaleDecorator>
          )}
          initialNumToRender={10}
          ListFooterComponent={_ListFooterComponent}
          ListEmptyComponent={_ListEmptyComponent}
          extraData={savedFeeds.isLoading}
          onDragEnd={({data}) => savedFeeds.reorderPinnedFeeds(data)}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      </CenteredView>
    )
  }),
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 18,
  },
  item: {
    borderTopWidth: 0,
  },
  icon: {marginRight: 10},
})
