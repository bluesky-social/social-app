import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useIsFocused} from '@react-navigation/native'
import {useAnalytics} from '@segment/analytics-react-native'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {ComposeIcon2} from 'lib/icons'
import {colors, s} from 'lib/styles'
import React from 'react'
import {FlatList, View} from 'react-native'
import {useStores} from 'state/index'
import {useHeaderOffset, POLL_FREQ} from 'view/screens/Home'
import {Feed} from '../posts/Feed'
import {TextLink} from '../util/Link'
import {FAB} from '../util/fab/FAB'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import useAppState from 'react-native-appstate-hook'
import {logger} from '#/logger'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function FeedPage({
  testID,
  isPageFocused,
  feed,
  renderEmptyState,
  renderEndOfFeed,
}: {
  testID?: string
  feed: FeedDescriptor
  isPageFocused: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {isDesktop} = useWebMediaQueries()
  const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll()
  const {screen, track} = useAnalytics()
  const headerOffset = useHeaderOffset()
  const scrollElRef = React.useRef<FlatList>(null)
  // const {appState} = useAppState({ TODO
  //   onForeground: () => doPoll(true),
  // })
  const isScreenFocused = useIsFocused()
  const hasNew = false // TODOfeed.hasNewLatest && !feed.isRefreshing

  // TODO
  // const doPoll = React.useCallback(
  //   (knownActive = false) => {
  //     if (
  //       (!knownActive && appState !== 'active') ||
  //       !isScreenFocused ||
  //       !isPageFocused
  //     ) {
  //       return
  //     }
  //     if (feed.isLoading) {
  //       return
  //     }
  //     logger.debug('HomeScreen: Polling for new posts')
  //     feed.checkForLatest()
  //   },
  //   [appState, isScreenFocused, isPageFocused, feed],
  // )

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: -headerOffset})
    resetMainScroll()
  }, [headerOffset, resetMainScroll])

  const onSoftReset = React.useCallback(() => {
    if (isPageFocused) {
      scrollToTop()
      // feed.refresh() TODO
    }
  }, [isPageFocused, scrollToTop])

  // fires when page within screen is activated/deactivated
  // - check for latest
  React.useEffect(() => {
    if (!isPageFocused || !isScreenFocused) {
      return
    }

    const softResetSub = store.onScreenSoftReset(onSoftReset)
    // const pollInterval = setInterval(doPoll, POLL_FREQ) TODO

    screen('Feed')
    logger.debug('HomeScreen: Updating feed')
    // feed.checkForLatest() TODO

    return () => {
      // clearInterval(pollInterval) TODO
      softResetSub.remove()
    }
  }, [store, onSoftReset, screen, feed, isPageFocused, isScreenFocused])

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    store.shell.openComposer({})
  }, [store, track])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    // feed.refresh() TODO
  }, [scrollToTop])

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
            accessibilityLabel={_(msg`Feed Preferences`)}
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
  }, [isDesktop, pal.view, pal.text, pal.textLight, store, hasNew, _])

  return (
    <View testID={testID} style={s.h100pct}>
      <Feed
        testID={testID ? `${testID}-feed` : undefined}
        feed={feed}
        scrollElRef={scrollElRef}
        onScroll={onMainScroll}
        scrollEventThrottle={1}
        renderEmptyState={renderEmptyState}
        renderEndOfFeed={renderEndOfFeed}
        ListHeaderComponent={ListHeaderComponent}
        headerOffset={headerOffset}
      />
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}
      <FAB
        testID="composeFAB"
        onPress={onPressCompose}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </View>
  )
}
