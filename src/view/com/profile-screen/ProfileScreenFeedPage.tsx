import React, {useRef} from 'react'
import {FlatList, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useIsFocused} from '@react-navigation/native'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {EmptyState} from '../util/EmptyState'
import {Feed} from '../posts/Feed'
import {LoadLatestBtn} from '../util/load-latest/LoadLatestBtn'
import {FAB} from '../util/fab/FAB'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {ComposeIcon2} from 'lib/icons'

export const ProfileScreenFeedPage = observer(function FeedPageImpl({
  feed,
  minimalMode,
}: {
  feed: PostsFeedModel
  minimalMode?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const scrollElRef = useRef<FlatList>(null)
  const [onMainScroll, isScrolledDown, resetMainScroll] = useOnMainScroll(store)
  const isScreenFocused = useIsFocused()

  // event handlers
  // =

  const onScrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({offset: 0, animated: true})
    resetMainScroll()
  }, [scrollElRef, resetMainScroll])

  const onSoftReset = React.useCallback(() => {
    if (isScreenFocused) {
      onScrollToTop()
      feed.refresh()
    }
  }, [isScreenFocused, onScrollToTop, feed])

  // init
  // =

  React.useEffect(() => {
    if (!isScreenFocused) {
      return
    }

    const softResetSub = store.onScreenSoftReset(onSoftReset)
    return () => {
      softResetSub.remove()
    }
  }, [store, onSoftReset, isScreenFocused])

  // render
  // =

  const renderEmptyState = React.useCallback(() => {
    return (
      <View style={[pal.border, {borderTopWidth: 1, paddingTop: 20}]}>
        <EmptyState icon="feed" message="This feed is empty!" />
      </View>
    )
  }, [pal.border])

  return (
    <View style={{flex: 1}}>
      <Feed
        scrollElRef={scrollElRef}
        feed={feed}
        onScroll={onMainScroll}
        scrollEventThrottle={100}
        renderEmptyState={renderEmptyState}
        style={!isTabletOrDesktop ? {flex: 1} : undefined}
        desktopFixedHeightOffset={minimalMode ? 50 : 120}
      />
      {isScrolledDown ? (
        <LoadLatestBtn
          onPress={onSoftReset}
          label="Scroll to top"
          showIndicator={false}
        />
      ) : null}
      <FAB
        testID="composeFAB"
        onPress={() => store.shell.openComposer({})}
        icon={
          <ComposeIcon2 strokeWidth={1.5} size={29} style={{color: 'white'}} />
        }
        accessibilityRole="button"
        accessibilityLabel="New post"
        accessibilityHint=""
      />
    </View>
  )
})
