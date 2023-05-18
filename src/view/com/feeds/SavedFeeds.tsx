import React, {useEffect, useCallback} from 'react'
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {s} from 'lib/styles'
import {Link} from 'view/com/util/Link'
import {CustomFeed} from './CustomFeed'

export const SavedFeeds = observer(
  ({
    headerOffset = 0,
    isPageFocused,
  }: {
    headerOffset?: number
    isPageFocused: boolean
  }) => {
    const pal = usePalette('default')
    const store = useStores()

    useEffect(() => {
      if (isPageFocused) {
        store.shell.setMinimalShellMode(false)
        store.me.savedFeeds.refresh(true)
      }
    }, [store, isPageFocused])

    const renderListEmptyComponent = useCallback(() => {
      return (
        <View
          style={[
            pal.border,
            !isDesktopWeb && s.flex1,
            pal.viewLight,
            styles.empty,
          ]}>
          <Text type="lg" style={[pal.text]}>
            You don't have any saved feeds. You can find feeds by searching on
            Bluesky.
          </Text>
        </View>
      )
    }, [pal])

    const renderListFooterComponent = useCallback(() => {
      return (
        <Link
          style={[styles.footerLink, pal.border]}
          href="/settings/pinned-feeds">
          <FontAwesomeIcon icon="cog" size={18} color={pal.colors.icon} />
          <Text type="lg-medium" style={pal.textLight}>
            Settings
          </Text>
        </Link>
      )
    }, [pal])

    const renderItem = useCallback(
      ({item}) => <CustomFeed key={item.data.uri} item={item} />,
      [],
    )

    return (
      <CenteredView style={[s.flex1]}>
        <FlatList
          style={[!isDesktopWeb && s.flex1, {paddingTop: headerOffset}]}
          data={store.me.savedFeeds.feeds}
          keyExtractor={item => item.data.uri}
          refreshing={store.me.savedFeeds.isRefreshing}
          refreshControl={
            <RefreshControl
              refreshing={store.me.savedFeeds.isRefreshing}
              onRefresh={() => store.me.savedFeeds.refresh()}
              tintColor={pal.colors.text}
              titleColor={pal.colors.text}
              progressViewOffset={headerOffset}
            />
          }
          renderItem={renderItem}
          initialNumToRender={10}
          ListFooterComponent={renderListFooterComponent}
          ListEmptyComponent={renderListEmptyComponent}
          extraData={store.me.savedFeeds.isLoading}
          contentOffset={{x: 0, y: headerOffset * -1}}
          // @ts-ignore our .web version only -prf
          desktopFixedHeight
        />
      </CenteredView>
    )
  },
)

const styles = StyleSheet.create({
  footerLink: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 26,
    paddingVertical: 18,
    gap: 18,
  },
  empty: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 18,
    marginTop: 10,
  },
  feedItem: {
    borderTopWidth: 1,
  },
})
