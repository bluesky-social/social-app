import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import isEqual from 'lodash.isequal'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {FlatList} from 'view/com/util/Views'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {FAB} from 'view/com/util/fab/FAB'
import {Link} from 'view/com/util/Link'
import {NativeStackScreenProps, FeedsTabNavigatorParams} from 'lib/routes/types'
import {observer} from 'mobx-react-lite'
import {PostsMultiFeedModel} from 'state/models/feeds/multi-feed'
import {MultiFeed} from 'view/com/posts/MultiFeed'
import {isDesktopWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {ComposeIcon2, CogIcon} from 'lib/icons'
import {s} from 'lib/styles'

const HEADER_OFFSET = isDesktopWeb ? 0 : 40

type Props = NativeStackScreenProps<FeedsTabNavigatorParams, 'Feeds'>
export const FeedsScreen = withAuthRequired(
  observer<Props>(({}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const flatListRef = React.useRef<FlatList>(null)
    const multifeed = React.useMemo<PostsMultiFeedModel>(
      () => new PostsMultiFeedModel(store),
      [store],
    )
    const [onMainScroll, isScrolledDown, resetMainScroll] =
      useOnMainScroll(store)

    const onSoftReset = React.useCallback(() => {
      flatListRef.current?.scrollToOffset({offset: 0})
      resetMainScroll()
    }, [flatListRef, resetMainScroll])

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        const multifeedCleanup = multifeed.registerListeners()
        const cleanup = () => {
          softResetSub.remove()
          multifeedCleanup()
        }

        store.shell.setMinimalShellMode(false)
        return cleanup
      }, [store, multifeed, onSoftReset]),
    )

    React.useEffect(() => {
      if (
        isEqual(
          multifeed.feedInfos.map(f => f.uri),
          store.me.savedFeeds.all.map(f => f.uri),
        )
      ) {
        // no changes
        return
      }
      multifeed.refresh()
    }, [multifeed, store.me.savedFeeds.all])

    const onPressCompose = React.useCallback(() => {
      store.shell.openComposer({})
    }, [store])

    const renderHeaderBtn = React.useCallback(() => {
      return (
        <Link
          href="/settings/saved-feeds"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Edit Saved Feeds"
          accessibilityHint="Opens screen to edit Saved Feeds">
          <CogIcon size={22} strokeWidth={2} style={pal.textLight} />
        </Link>
      )
    }, [pal])

    return (
      <View style={[pal.view, styles.container]}>
        <MultiFeed
          scrollElRef={flatListRef}
          multifeed={multifeed}
          onScroll={onMainScroll}
          scrollEventThrottle={100}
          headerOffset={HEADER_OFFSET}
        />
        <ViewHeader
          title="My Feeds"
          canGoBack={false}
          hideOnScroll
          renderButton={renderHeaderBtn}
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
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel="Compose post"
          accessibilityHint=""
        />
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
