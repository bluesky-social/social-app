import React, {useCallback, useMemo} from 'react'
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {CommonNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {SavedFeedsModel} from 'state/models/ui/saved-feeds'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {ScrollView, CenteredView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {s, colors} from 'lib/styles'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import * as Toast from 'view/com/util/Toast'
import {Haptics} from 'lib/haptics'
import {TextLink} from 'view/com/util/Link'

const HITSLOP_TOP = {
  top: 20,
  left: 20,
  bottom: 5,
  right: 20,
}
const HITSLOP_BOTTOM = {
  top: 5,
  left: 20,
  bottom: 20,
  right: 20,
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export const SavedFeeds = withAuthRequired(
  observer(function SavedFeedsImpl({}: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {isMobile, isTabletOrDesktop} = useWebMediaQueries()
    const {screen} = useAnalytics()

    const savedFeeds = useMemo(() => {
      const model = new SavedFeedsModel(store)
      model.refresh()
      return model
    }, [store])
    useFocusEffect(
      useCallback(() => {
        screen('SavedFeeds')
        store.shell.setMinimalShellMode(false)
        savedFeeds.refresh()
      }, [screen, store, savedFeeds]),
    )

    return (
      <CenteredView
        style={[
          s.hContentRegion,
          pal.border,
          isTabletOrDesktop && styles.desktopContainer,
        ]}>
        <ViewHeader title="Edit My Feeds" showOnDesktop showBorder />
        <ScrollView style={s.flex1}>
          <View style={[pal.text, pal.border, styles.title]}>
            <Text type="title" style={pal.text}>
              Pinned Feeds
            </Text>
          </View>
          {savedFeeds.hasLoaded ? (
            !savedFeeds.pinned.length ? (
              <View
                style={[
                  pal.border,
                  isMobile && s.flex1,
                  pal.viewLight,
                  styles.empty,
                ]}>
                <Text type="lg" style={[pal.text]}>
                  You don't have any pinned feeds.
                </Text>
              </View>
            ) : (
              savedFeeds.pinned.map(feed => (
                <ListItem
                  key={feed._reactKey}
                  savedFeeds={savedFeeds}
                  item={feed}
                />
              ))
            )
          ) : (
            <ActivityIndicator style={{marginTop: 20}} />
          )}
          <View style={[pal.text, pal.border, styles.title]}>
            <Text type="title" style={pal.text}>
              Saved Feeds
            </Text>
          </View>
          {savedFeeds.hasLoaded ? (
            !savedFeeds.unpinned.length ? (
              <View
                style={[
                  pal.border,
                  isMobile && s.flex1,
                  pal.viewLight,
                  styles.empty,
                ]}>
                <Text type="lg" style={[pal.text]}>
                  You don't have any saved feeds.
                </Text>
              </View>
            ) : (
              savedFeeds.unpinned.map(feed => (
                <ListItem
                  key={feed._reactKey}
                  savedFeeds={savedFeeds}
                  item={feed}
                />
              ))
            )
          ) : (
            <ActivityIndicator style={{marginTop: 20}} />
          )}

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
          <View style={{height: 100}} />
        </ScrollView>
      </CenteredView>
    )
  }),
)

const ListItem = observer(function ListItemImpl({
  savedFeeds,
  item,
}: {
  savedFeeds: SavedFeedsModel
  item: FeedSourceModel
}) {
  const pal = usePalette('default')
  const store = useStores()
  const isPinned = item.isPinned

  const onTogglePinned = useCallback(() => {
    Haptics.default()
    item.togglePin().catch(e => {
      Toast.show('There was an issue contacting the server')
      store.log.error('Failed to toggle pinned feed', {e})
    })
  }, [item, store])
  const onPressUp = useCallback(
    () =>
      savedFeeds.movePinnedFeed(item, 'up').catch(e => {
        Toast.show('There was an issue contacting the server')
        store.log.error('Failed to set pinned feed order', {e})
      }),
    [store, savedFeeds, item],
  )
  const onPressDown = useCallback(
    () =>
      savedFeeds.movePinnedFeed(item, 'down').catch(e => {
        Toast.show('There was an issue contacting the server')
        store.log.error('Failed to set pinned feed order', {e})
      }),
    [store, savedFeeds, item],
  )

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.itemContainer, pal.border]}>
      {isPinned ? (
        <View style={styles.webArrowButtonsContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onPressUp}
            hitSlop={HITSLOP_TOP}>
            <FontAwesomeIcon
              icon="arrow-up"
              size={12}
              style={[pal.text, styles.webArrowUpButton]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onPressDown}
            hitSlop={HITSLOP_BOTTOM}>
            <FontAwesomeIcon icon="arrow-down" size={12} style={[pal.text]} />
          </TouchableOpacity>
        </View>
      ) : null}
      <FeedSourceCard
        key={item.uri}
        item={item}
        showSaveBtn
        style={styles.noBorder}
      />
      <TouchableOpacity
        accessibilityRole="button"
        hitSlop={10}
        onPress={onTogglePinned}>
        <FontAwesomeIcon
          icon="thumb-tack"
          size={20}
          color={isPinned ? colors.blue3 : pal.colors.icon}
        />
      </TouchableOpacity>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    // @ts-ignore only rendered on web
    minHeight: '100vh',
  },
  empty: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
  },
  title: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingRight: 16,
  },
  webArrowButtonsContainer: {
    paddingLeft: 16,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  webArrowUpButton: {
    marginBottom: 10,
  },
  noBorder: {
    borderTopWidth: 0,
  },
  footerText: {
    paddingHorizontal: 26,
    paddingTop: 22,
    paddingBottom: 100,
  },
})
