import React, {useEffect, useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewSelector, ViewSelectorHandle} from '../com/util/ViewSelector'
import {CenteredView} from '../com/util/Views'
import {ScreenHider} from 'view/com/util/moderation/ScreenHider'
import {ProfileUiModel, Sections} from 'state/models/ui/profile'
import {Feed} from 'view/com/posts/Feed'
import {useStores} from 'state/index'
import {PostsFeedSliceModel} from 'state/models/feeds/posts-slice'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {FeedSlice} from '../com/posts/FeedSlice'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ListCard} from 'view/com/lists/ListCard'
import {
  PostFeedLoadingPlaceholder,
  ProfileCardFeedLoadingPlaceholder,
} from '../com/util/LoadingPlaceholder'
import {ErrorScreen} from '../com/util/error/ErrorScreen'
import {ErrorMessage} from '../com/util/error/ErrorMessage'
import {EmptyState} from '../com/util/EmptyState'
import {Text} from '../com/util/text/Text'
import {FAB} from '../com/util/fab/FAB'
import {s, colors} from 'lib/styles'
import {useAnalytics} from 'lib/analytics/analytics'
import {ComposeIcon2} from 'lib/icons'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {combinedDisplayName} from 'lib/strings/display-names'
import {logger} from '#/logger'

const SECTION_TITLES_PROFILE = ['Posts', 'Posts & Replies'] // TODO: Other sections

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export const ProfileScreen = withAuthRequired(
  observer(function ProfileScreenImpl({route}: Props) {
    const store = useStores()
    const {screen, track} = useAnalytics()
    const viewSelectorRef = React.useRef<ViewSelectorHandle>(null)
    const name = route.params.name === 'me' ? store.me.did : route.params.name

    useEffect(() => {
      screen('Profile')
    }, [screen])

    const [hasSetup, setHasSetup] = useState<boolean>(false)
    const uiState = React.useMemo(
      () => new ProfileUiModel(store, {user: name}),
      [name, store],
    )
    useSetTitle(combinedDisplayName(uiState.profile))

    const onSoftReset = React.useCallback(() => {
      viewSelectorRef.current?.scrollToTop()
    }, [])

    useEffect(() => {
      setHasSetup(false)
    }, [name])

    // We don't need this to be reactive, so we can just register the listeners once
    useEffect(() => {
      const listCleanup = uiState.lists.registerListeners()
      return () => listCleanup()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useFocusEffect(
      React.useCallback(() => {
        const softResetSub = store.onScreenSoftReset(onSoftReset)
        let aborted = false
        store.shell.setMinimalShellMode(false)
        const feedCleanup = uiState.feed.registerListeners()
        if (!hasSetup) {
          uiState.setup().then(() => {
            if (aborted) {
              return
            }
            setHasSetup(true)
          })
        }
        return () => {
          aborted = true
          feedCleanup()
          softResetSub.remove()
        }
      }, [store, onSoftReset, uiState, hasSetup]),
    )

    // events
    // =

    const onPressCompose = React.useCallback(() => {
      track('ProfileScreen:PressCompose')
      const mention =
        uiState.profile.handle === store.me.handle ||
        uiState.profile.handle === 'handle.invalid'
          ? undefined
          : uiState.profile.handle
      store.shell.openComposer({mention})
    }, [store, track, uiState])

    const onRefresh = React.useCallback(() => {
      uiState
        .refresh()
        .catch((err: any) =>
          logger.error('Failed to refresh user profile', {error: err}),
        )
    }, [uiState])

    const onPressTryAgain = React.useCallback(() => {
      uiState.setup()
    }, [uiState])

    // rendering
    // =

    const renderHeader = React.useCallback(() => {
      if (!uiState) {
        return <View />
      }
      return (
        <ProfileHeader
          view={uiState.profile}
          onRefreshAll={onRefresh}
          hideBackButton={route.params.hideBackButton}
        />
      )
    }, [uiState, onRefresh, route.params.hideBackButton])

    return (
      <ScreenHider
        testID="profileView"
        style={styles.container}
        screenDescription="profile"
        moderation={uiState.profile.moderation.account}>
        {uiState.profile.hasError ? (
          <ErrorScreen
            testID="profileErrorScreen"
            title="Failed to load profile"
            message={uiState.profile.error}
            onPressTryAgain={onPressTryAgain}
          />
        ) : (
          <View
            style={{
              flex: 1,
            }}>
            <PagerWithHeader
              isHeaderReady={uiState.profile.hasLoaded}
              items={SECTION_TITLES_PROFILE}
              renderHeader={renderHeader}>
              {({onScroll, headerHeight, isScrolledDown}) => (
                <FeedSection
                  ref={null}
                  feed={uiState.feed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                />
              )}
              {({onScroll, headerHeight, isScrolledDown}) => (
                <FeedSection
                  ref={null}
                  feed={uiState.feed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                />
              )}
            </PagerWithHeader>
          </View>
        )}
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel="New post"
          accessibilityHint=""
        />
      </ScreenHider>
    )
  }),
)

interface FeedSectionProps {
  feed: PostsFeedModel
  onScroll: OnScrollCb
  headerHeight: number
  isScrolledDown: boolean
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {feed, onScroll, headerHeight, isScrolledDown},
    ref,
  ) {
    const hasNew = feed.hasNewLatest && !feed.isRefreshing
    const scrollElRef = React.useRef<FlatList>(null)

    const onScrollToTop = React.useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -headerHeight})
      feed.refresh()
    }, [feed, scrollElRef, headerHeight])
    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = React.useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    return (
      <View>
        <Feed
          testID="listFeed"
          feed={feed}
          scrollElRef={scrollElRef}
          onScroll={onScroll}
          scrollEventThrottle={1}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
      </View>
    )
  },
)

function LoadingMoreFooter() {
  return (
    <View style={styles.loadingMoreFooter}>
      <ActivityIndicator />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  loading: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  emptyState: {
    paddingVertical: 40,
  },
  loadingMoreFooter: {
    paddingVertical: 20,
  },
  endItem: {
    paddingTop: 20,
    paddingBottom: 30,
    color: colors.gray5,
    textAlign: 'center',
  },
})
