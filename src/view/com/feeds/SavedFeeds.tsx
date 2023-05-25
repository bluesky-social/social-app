import React, {useEffect, useCallback} from 'react'
import {RefreshControl, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {FlatList} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {isDesktopWeb} from 'platform/detection'
import {s} from 'lib/styles'
import {Link, TextLink} from 'view/com/util/Link'
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

    const onRefresh = useCallback(() => {
      store.me.savedFeeds.refresh()
    }, [store])

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
        <>
          <View style={[styles.footerLinks, pal.border]}>
            <Link style={[styles.footerLink, pal.border]} href="/search/feeds">
              <FontAwesomeIcon
                icon="search"
                size={18}
                color={pal.colors.icon}
              />
              <Text type="lg-medium" style={pal.textLight}>
                Discover new feeds
              </Text>
            </Link>
            {!store.me.savedFeeds.isEmpty && (
              <Link
                style={[styles.footerLink, pal.border]}
                href="/settings/saved-feeds">
                <FontAwesomeIcon icon="cog" size={18} color={pal.colors.icon} />
                <Text type="lg-medium" style={pal.textLight}>
                  Change Order
                </Text>
              </Link>
            )}
          </View>
          <View style={styles.footerText}>
            <Text type="sm" style={pal.textLight}>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <TextLink
                type="sm"
                style={pal.link}
                href="https://github.com/bluesky-social/feed-generator"
                text="See this guide"
              />{' '}
              for more information.
            </Text>
          </View>
        </>
      )
    }, [pal, store.me.savedFeeds.isEmpty])

    const renderItem = useCallback(
      ({item}) => <CustomFeed key={item.data.uri} item={item} />,
      [],
    )

    return (
      <FlatList
        style={[!isDesktopWeb && s.flex1, {paddingTop: headerOffset}]}
        data={store.me.savedFeeds.feeds}
        keyExtractor={item => item.data.uri}
        refreshing={store.me.savedFeeds.isRefreshing}
        refreshControl={
          <RefreshControl
            refreshing={store.me.savedFeeds.isRefreshing}
            onRefresh={onRefresh}
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
    )
  },
)

const styles = StyleSheet.create({
  footerLinks: {
    marginTop: 8,
    borderBottomWidth: 1,
  },
  footerLink: {
    flexDirection: 'row',
    borderTopWidth: 1,
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
  footerText: {
    paddingHorizontal: 26,
    paddingVertical: 22,
  },
})
