import React from 'react'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {useAnalytics} from 'lib/analytics/analytics'
import {useQueryClient} from '@tanstack/react-query'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {FeedDescriptor, FeedParams} from '#/state/queries/post-feed'
import {ComposeIcon2} from 'lib/icons'
import {colors, s} from 'lib/styles'
import {View, useWindowDimensions} from 'react-native'
import {ListMethods} from '../util/List'
import {Feed} from '../posts/Feed'
import {TextLink} from '../util/Link'
import {FAB} from '../util/fab/FAB'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {listenSoftReset, emitSoftReset} from '#/state/events'
import {truncateAndInvalidate} from '#/state/queries/util'
import {TabState, getTabState, getRootNavigation} from '#/lib/routes/helpers'
import {isNative} from '#/platform/detection'

const POLL_FREQ = 30e3 // 30sec

export function FeedPage({
  testID,
  isPageFocused,
  feed,
  feedParams,
  renderEmptyState,
  renderEndOfFeed,
}: {
  testID?: string
  feed: FeedDescriptor
  feedParams?: FeedParams
  isPageFocused: boolean
  renderEmptyState: () => JSX.Element
  renderEndOfFeed?: () => JSX.Element
}) {
  const {isSandbox, hasSession} = useSession()
  const pal = usePalette('default')
  const {_} = useLingui()
  const navigation = useNavigation()
  const {isDesktop} = useWebMediaQueries()
  const queryClient = useQueryClient()
  const {openComposer} = useComposerControls()
  const [isScrolledDown, setIsScrolledDown] = React.useState(false)
  const [onMainScroll, resetMainScroll] = useOnMainScroll()
  const {screen, track} = useAnalytics()
  const headerOffset = useHeaderOffset()
  const scrollElRef = React.useRef<ListMethods>(null)
  const [hasNew, setHasNew] = React.useState(false)

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    resetMainScroll()
  }, [headerOffset, resetMainScroll])

  const onSoftReset = React.useCallback(() => {
    const isScreenFocused =
      getTabState(getRootNavigation(navigation).getState(), 'Home') ===
      TabState.InsideAtRoot
    if (isScreenFocused && isPageFocused) {
      scrollToTop()
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
    }
  }, [navigation, isPageFocused, scrollToTop, queryClient, feed, setHasNew])

  // fires when page within screen is activated/deactivated
  React.useEffect(() => {
    if (!isPageFocused) {
      return
    }
    screen('Feed')
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, screen, isPageFocused])

  const onPressCompose = React.useCallback(() => {
    track('HomeScreen:PressCompose')
    openComposer({})
  }, [openComposer, track])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
  }, [scrollToTop, feed, queryClient, setHasNew])

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
                {isSandbox ? 'SANDBOX' : 'Bluesky'}{' '}
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
            onPress={emitSoftReset}
          />
          {hasSession && (
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
          )}
        </View>
      )
    }
    return <></>
  }, [
    isDesktop,
    pal.view,
    pal.text,
    pal.textLight,
    hasNew,
    _,
    isSandbox,
    hasSession,
  ])

  return (
    <View testID={testID} style={s.h100pct}>
      <Feed
        testID={testID ? `${testID}-feed` : undefined}
        enabled={isPageFocused}
        feed={feed}
        feedParams={feedParams}
        pollInterval={POLL_FREQ}
        scrollElRef={scrollElRef}
        onScroll={onMainScroll}
        onScrolledDownChange={setIsScrolledDown}
        onHasNew={setHasNew}
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

      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      )}
    </View>
  )
}

function useHeaderOffset() {
  const {isDesktop, isTablet} = useWebMediaQueries()
  const {fontScale} = useWindowDimensions()
  const {hasSession} = useSession()

  if (isDesktop) {
    return 0
  }
  if (isTablet) {
    if (hasSession) {
      return 50
    } else {
      return 0
    }
  }

  if (hasSession) {
    const navBarPad = 16
    const navBarText = 21 * fontScale
    const tabBarPad = 20 + 3 // nav bar padding + border
    const tabBarText = 16 * fontScale
    const magic = 7 * fontScale
    return navBarPad + navBarText + tabBarPad + tabBarText + magic
  } else {
    const navBarPad = 16
    const navBarText = 21 * fontScale
    const magic = 4 * fontScale
    return navBarPad + navBarText + magic
  }
}
