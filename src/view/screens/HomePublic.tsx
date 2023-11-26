import React from 'react'
import {View, StyleSheet, FlatList, TouchableOpacity} from 'react-native'
import Animated from 'react-native-reanimated'
import {useFocusEffect} from '@react-navigation/native'
import {CustomFeedEmptyState} from 'view/com/posts/CustomFeedEmptyState'
import {useSetMinimalShellMode, useSetDrawerSwipeDisabled} from '#/state/shell'
import {listenSoftReset, emitSoftReset} from '#/state/events'
import {useSession} from '#/state/session'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useIsFocused} from '@react-navigation/native'
import {useAnalytics} from '@segment/analytics-react-native'
import {useQueryClient} from '@tanstack/react-query'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {colors, s} from 'lib/styles'
import {Feed} from '#/view/com/posts/Feed'
import {TextLink} from '#/view/com/util/Link'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSetDrawerOpen} from '#/state/shell/drawer-open'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {HITSLOP_10} from 'lib/constants'
import {Text} from '#/view/com/util/text/Text'

const DISCOVER_FEED = `feedgen|at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot`
const POLL_FREQ = 30e3 // 30sec

function Header({hasNew}: {hasNew: boolean}) {
  const pal = usePalette('default')
  const {isSandbox} = useSession()
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const brandBlue = useColorSchemeStyle(s.brandBlue, s.blue3)
  const {headerHeight} = useShellLayout()
  const {headerMinimalShellTransform} = useMinimalShellMode()
  const {isTablet, isDesktop} = useWebMediaQueries()

  const onPressAvi = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  return isTablet || isDesktop ? (
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
    </View>
  ) : (
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <View style={[pal.view]}>
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            onPress={onPressAvi}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Open navigation`)}
            accessibilityHint="Access profile and other navigation links"
            hitSlop={HITSLOP_10}>
            <FontAwesomeIcon
              icon="bars"
              size={18}
              color={pal.colors.textLight}
            />
          </TouchableOpacity>
        </View>
        <Text style={[brandBlue, s.bold, styles.title]}>
          {isSandbox ? 'SANDBOX' : 'Bluesky'}
        </Text>
        <View style={[pal.view, {width: 18}]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // position: 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
    borderBottomWidth: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    width: '100%',
  },
  title: {
    fontSize: 21,
  },
})

export function HomePublic() {
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const queryClient = useQueryClient()
  const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll()
  const {screen} = useAnalytics()
  const scrollElRef = React.useRef<FlatList>(null)
  const isScreenFocused = useIsFocused()
  const [hasNew, setHasNew] = React.useState(false)

  const scrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0})
    resetMainScroll()
  }, [resetMainScroll])

  const onSoftReset = React.useCallback(() => {
    scrollToTop()
    queryClient.invalidateQueries({queryKey: FEED_RQKEY(DISCOVER_FEED)})
    setHasNew(false)
  }, [scrollToTop, queryClient, setHasNew])

  // fires when page within screen is activated/deactivated
  React.useEffect(() => {
    if (isScreenFocused) {
      return
    }
    screen('Feed')
    return listenSoftReset(onSoftReset)
  }, [onSoftReset, screen, isScreenFocused])

  const onPressLoadLatest = React.useCallback(() => {
    scrollToTop()
    queryClient.invalidateQueries({queryKey: FEED_RQKEY(DISCOVER_FEED)})
    setHasNew(false)
  }, [scrollToTop, queryClient, setHasNew])

  const renderCustomFeedEmptyState = React.useCallback(() => {
    return <CustomFeedEmptyState />
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
      setDrawerSwipeDisabled(false)
    }, [setDrawerSwipeDisabled, setMinimalShellMode]),
  )

  const ListHeaderComponent = React.useCallback(() => {
    return <Header hasNew={hasNew} />
  }, [hasNew])

  return (
    <View style={s.h100pct}>
      <Feed
        enabled
        feed={DISCOVER_FEED}
        pollInterval={POLL_FREQ}
        scrollElRef={scrollElRef}
        onScroll={onMainScroll}
        onHasNew={setHasNew}
        scrollEventThrottle={1}
        renderEmptyState={renderCustomFeedEmptyState} // TODO
        renderEndOfFeed={renderCustomFeedEmptyState} // TODO
        ListHeaderComponent={ListHeaderComponent}
      />

      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onPressLoadLatest}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}
    </View>
  )
}
