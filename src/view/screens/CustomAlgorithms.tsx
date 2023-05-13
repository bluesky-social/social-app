import React, {useCallback, useMemo} from 'react'
import {
  RefreshControl,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useAnalytics} from 'lib/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {SavedFeedsModel} from 'state/models/feeds/algo/saved'
import AlgoItem from 'view/com/algos/AlgoItem'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {s} from 'lib/styles'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomAlgorithms'>

const CustomAlgorithms = withAuthRequired(
  observer(({}: Props) => {
    const pal = usePalette('default')
    const rootStore = useStores()
    const {screen} = useAnalytics()

    const savedFeeds = useMemo(
      () => new SavedFeedsModel(rootStore),
      [rootStore],
    )

    useFocusEffect(
      useCallback(() => {
        screen('SavedFeeds')
        rootStore.shell.setMinimalShellMode(false)
        savedFeeds.refresh()
      }, [screen, rootStore, savedFeeds]),
    )

    return (
      <CenteredView style={{flex: 1}}>
        <ViewHeader title="Custom Algorithms" showOnDesktop />
        {!savedFeeds.hasContent || savedFeeds.isEmpty ? (
          <View style={[pal.border, !isDesktopWeb && s.flex1]}>
            <View style={[pal.viewLight]}>
              <Text type="lg" style={[pal.text]}>
                You don't have any saved feeds. To save a feed, click the save
                button when a custom feed or algorithm shows up.
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            style={[!isDesktopWeb && s.flex1]}
            data={savedFeeds.feeds}
            keyExtractor={item => item.data.uri}
            refreshControl={
              <RefreshControl
                refreshing={savedFeeds.isRefreshing}
                onRefresh={() => savedFeeds.refresh()}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            onEndReached={() => savedFeeds.loadMore()}
            renderItem={({item}) => (
              <AlgoItem key={item.data.uri} item={item} />
            )}
            initialNumToRender={15}
            ListFooterComponent={() => (
              <View style={styles.footer}>
                {savedFeeds.isLoading && <ActivityIndicator />}
              </View>
            )}
            extraData={savedFeeds.isLoading}
            // @ts-ignore our .web version only -prf
            desktopFixedHeight
          />
        )}
      </CenteredView>
    )
  }),
)

export default CustomAlgorithms

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
  },
})
