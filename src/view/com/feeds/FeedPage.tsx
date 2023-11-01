import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useIsFocused} from '@react-navigation/native'
import {useAnalytics} from '@segment/analytics-react-native'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from 'lib/icons'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import React from 'react'
import {FlatList, View} from 'react-native'
import {useStores} from 'state/index'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useHeaderOffset, POLL_FREQ} from 'view/screens/Home'
import {Feed} from '../posts/Feed'
import {TextLink} from '../util/Link'
import {FAB} from '../util/fab/FAB'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import useAppState from 'react-native-appstate-hook'

export const FeedPage = observer(function FeedPageImpl({
  testID,
  isPageFocused,
  feed,
  renderEmptyState,
  renderEndOfFeed,
}: {
  testID?: string
  feed: PostsFeedModel
  isPageFocused: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {isDesktop} = useWebMediaQueries()
  const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll(store)
  const {screen, track} = useAnalytics()
  const headerOffset = useHeaderOffset()
  const scrollElRef = React.useRef<FlatList>(null)
  const {appState} = useAppState({
    onForeground: () => doPoll(true),
  })
  const isScreenFocused = useIsFocused()
  const hasNew = feed.hasNewLatest && !feed.isRefreshing

  React.useEffect(() => {
    // called on first load
    if (!feed.hasLoaded && isPageFocused) {
      feed.setup()
    }
  }, [isPageFocused, feed])

  const doPoll = React.useCallback(
    (knownActive = false) => {
      if (
        (!knownActive && appState !== 'active') ||
        !isScreenFocused ||
        !isPageFocused
      ) {
        return
      }
      if (feed.isLoading) {
        return
      }
      store.log.debug('HomeScreen: Polling for new posts')
      feed.checkForLatest()
    },
    [appState, isScreenFocused, isPageFocused, store, feed],
  )

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: -headerOffset})
    resetMainScroll()
  }, [headerOffset, resetMainScroll])

  const onSoftReset = React.useCallback(() => {
    if (isPageFocused) {
      scrollToTop()
      feed.refresh()
    }
  }, [isPageFocused, scrollToTop, feed])

  // fires when page within screen is activated/deactivated
  // - check for latest
  React.useEffect(() => {
    if (!isPageFocused || !isScreenFocused) {
      return
    }

    const softResetSub = store.onScreenSoftReset(onSoftReset)
    const feedCleanup = feed.registerListeners()
    const pollInterval = setInterval(doPoll, POLL_FREQ)

    screen('Feed')
    store.log.debug('HomeScreen: Updating feed')
    feed.checkForLatest()

    return () => {
      clearInterval(pollInterval)
      softResetSub.remove()
      feedCleanup()
    }
  }, [store, doPoll, onSoftReset, screen, feed, isPageFocused, isScreenFocused])

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    store.shell.openComposer({})
  }, [store, track])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    feed.refresh()
  }, [feed, scrollToTop])

  const ListHeaderComponent = React.useCallback(() => {
    if (isDesktop) {
      return (
        <View
          style={[
            pal.view,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              paddingVertical: 12,
            },
          ]}>
          <TextLink
            type="title-lg"
            href="/"
            style={[pal.text, {fontWeight: 'bold'}]}
            text={
              <>
                {store.session.isSandbox ? 'SANDBOX' : 'Bluesky'}{' '}
                {hasNew && (
                  <View
                    style={{
                      top: -8,
                      backgroundColor: colors.blue3,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                    }}
                  />
                )}
              </>
            }
            onPress={() => store.emitScreenSoftReset()}
          />
          <TextLink
            type="title-lg"
            href="/settings/home-feed"
            style={{fontWeight: 'bold'}}
            accessibilityLabel="Feed Preferences"
            accessibilityHint=""
            text={
              <FontAwesomeIcon
                icon="sliders"
                style={pal.textLight as FontAwesomeIconStyle}
              />
            }
          />
        </View>
      )
    }
    return <></>
  }, [isDesktop, pal, store, hasNew])

  return (
    <View testID={testID} style={s.h100pct}>
      <Feed
        testID={testID ? `${testID}-feed` : undefined}
        feed={feed}
        scrollElRef={scrollElRef}
        onScroll={onMainScroll}
        scrollEventThrottle={100}
        renderEmptyState={renderEmptyState}
        renderEndOfFeed={renderEndOfFeed}
        ListHeaderComponent={ListHeaderComponent}
        headerOffset={headerOffset}
      />
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label="Load new posts"
          showIndicator={hasNew}
        />
      )}
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel="New post"
        accessibilityHint=""
      />
    </View>
  )
})
