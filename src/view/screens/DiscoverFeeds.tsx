import React from 'react'
import {RefreshControl, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from 'state/index'
import {FeedsDiscoveryModel} from 'state/models/discovery/feeds'
import {CenteredView, FlatList} from 'view/com/util/Views'
import {CustomFeed} from 'view/com/feeds/CustomFeed'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DiscoverFeeds'>
export const DiscoverFeedsScreen = withAuthRequired(
  observer(({}: Props) => {
    const store = useStores()
    const pal = usePalette('default')
    const feeds = React.useMemo(() => new FeedsDiscoveryModel(store), [store])

    useFocusEffect(
      React.useCallback(() => {
        store.shell.setMinimalShellMode(false)
        feeds.refresh()
      }, [store, feeds]),
    )

    const onRefresh = React.useCallback(() => {
      store.me.savedFeeds.refresh()
    }, [store])

    const renderListEmptyComponent = React.useCallback(() => {
      return (
        <View
          style={[
            pal.border,
            !isDesktopWeb && s.flex1,
            pal.viewLight,
            styles.empty,
          ]}>
          <Text type="lg" style={[pal.text]}>
            {feeds.isLoading
              ? 'Loading...'
              : `We can't find any feeds for some reason. This is probably an error - try refreshing!`}
          </Text>
        </View>
      )
    }, [pal, feeds.isLoading])

    const renderItem = React.useCallback(
      ({item}) => (
        <CustomFeed
          key={item.data.uri}
          item={item}
          showSaveBtn
          showDescription
          showLikes
        />
      ),
      [],
    )

    return (
      <CenteredView style={[styles.container, pal.view]}>
        <View style={[isDesktopWeb && styles.containerDesktop, pal.border]}>
          <ViewHeader title="Discover Feeds" showOnDesktop />
        </View>
        <FlatList
          style={[!isDesktopWeb && s.flex1]}
          data={feeds.feeds}
          keyExtractor={item => item.data.uri}
          refreshControl={
            <RefreshControl
              refreshing={feeds.isRefreshing}
              onRefresh={onRefresh}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
            />
          }
          renderItem={renderItem}
          initialNumToRender={10}
          ListEmptyComponent={renderListEmptyComponent}
          extraData={feeds.isLoading}
        />
      </CenteredView>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 100,
  },
  containerDesktop: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  empty: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 18,
    marginTop: 10,
  },
})
