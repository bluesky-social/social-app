import React, {useEffect, useMemo, useState} from 'react'
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
import {useAnimatedScrollHandler} from 'react-native-reanimated'

import {ProfileModel} from 'state/models/content/profile'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {ActorFeedsModel} from 'state/models/lists/actor-feeds'
import {ListsListModel} from 'state/models/lists-list'

const SECTION_TITLES_PROFILE = ['Posts', 'Posts & Replies', 'Media', 'Likes']

import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSetDrawerSwipeDisabled, useSetMinimalShellMode} from '#/state/shell'
import {OnScrollCb} from '#/lib/hooks/useOnMainScroll'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export const ProfileScreen = withAuthRequired(
  observer(function ProfileScreenImpl({route}: Props) {
    const store = useStores()
    const setMinimalShellMode = useSetMinimalShellMode()
    const {screen, track} = useAnalytics()
    const [currentPage, setCurrentPage] = React.useState(0)
    const {_} = useLingui()
    const viewSelectorRef = React.useRef<ViewSelectorHandle>(null)
    const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
    const name = route.params.name === 'me' ? store.me.did : route.params.name

    const profile = useMemo(() => {
      const model = new ProfileModel(store, {actor: name})
      model.setup() // TODO
      return model
    }, [name, store])

    const postsFeed = useMemo(() => {
      const model = new PostsFeedModel(store, 'author', {
        actor: name,
        limit: 10,
        filter: 'posts_no_replies',
      })
      return model
    }, [name, store])

    const postsWithRepliesFeed = useMemo(() => {
      const model = new PostsFeedModel(store, 'author', {
        actor: name,
        limit: 10,
        filter: 'posts_with_replies',
      })
      return model
    }, [name, store])

    const postsWithMediaFeed = useMemo(() => {
      const model = new PostsFeedModel(store, 'author', {
        actor: name,
        limit: 10,
        filter: 'posts_with_media',
      })
      return model
    }, [name, store])

    const likesFeed = useMemo(() => {
      const model = new PostsFeedModel(
        store,
        'likes',
        {
          actor: name,
          limit: 10,
        },
        {
          isSimpleFeed: true,
        },
      )
      return model
    }, [name, store])

    useEffect(() => {
      switch (currentPage) {
        case 0: {
          postsFeed.setup()
          break
        }
        case 1: {
          postsWithRepliesFeed.setup()
          break
        }
        case 2: {
          postsWithMediaFeed.setup()
          break
        }
        case 3: {
          likesFeed.setup()
          break
        }
      }
    }, [currentPage, postsFeed, postsWithRepliesFeed, postsWithMediaFeed, likesFeed])

    /*
    - todo
        - feeds
        - lists
    */

    useFocusEffect(
      React.useCallback(() => {
        setMinimalShellMode(false)
        const softResetSub = store.onScreenSoftReset(() => {
          viewSelectorRef.current?.scrollToTop()
        })
        return () => softResetSub.remove()
      }, [store, viewSelectorRef, setMinimalShellMode]),
    )

    useFocusEffect(
      React.useCallback(() => {
        setDrawerSwipeDisabled(currentPage > 0)
        return () => {
          setDrawerSwipeDisabled(false)
        }
      }, [setDrawerSwipeDisabled, currentPage]),
    )

    useFocusEffect(
      React.useCallback(() => {
        const subs = []
        subs.push(postsFeed.registerListeners())
        subs.push(postsWithRepliesFeed.registerListeners())
        subs.push(postsWithMediaFeed.registerListeners())
        subs.push(likesFeed.registerListeners())
        return () => {
          subs.forEach(unsub => unsub())
        }
      }, [postsFeed, postsWithRepliesFeed, postsWithMediaFeed, likesFeed]),
    )

    // events
    // =

    const onPressCompose = React.useCallback(() => {
      track('ProfileScreen:PressCompose')
      const mention =
        profile.handle === store.me.handle ||
        profile.handle === 'handle.invalid'
          ? undefined
          : profile.handle
      store.shell.openComposer({mention})
    }, [store, track, profile])

    const onRefresh = React.useCallback(() => {
      // TODO
    }, [])

    const onPressTryAgain = React.useCallback(() => {
      // TODO
    }, [])

    const onPageSelected = React.useCallback(
      i => {
        setCurrentPage(i)
      },
      [setCurrentPage],
    )

    // rendering
    // =

    const renderHeader = React.useCallback(() => {
      return (
        <ProfileHeader
          view={profile}
          onRefreshAll={onRefresh}
          hideBackButton={route.params.hideBackButton}
        />
      )
    }, [profile, onRefresh, route.params.hideBackButton])

    return (
      <ScreenHider
        testID="profileView"
        style={styles.container}
        screenDescription="profile"
        moderation={profile.moderation.account}>
        {profile.hasError ? (
          <ErrorScreen
            testID="profileErrorScreen"
            title="Failed to load profile"
            message={profile.error}
            onPressTryAgain={onPressTryAgain}
          />
        ) : (
          <View
            style={{
              flex: 1,
            }}>
            <PagerWithHeader
              isHeaderReady={profile.hasLoaded}
              items={SECTION_TITLES_PROFILE}
              onPageSelected={onPageSelected}
              renderHeader={renderHeader}>
              {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
                <FeedSection
                  ref={null}
                  feed={postsFeed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                  scrollElRef={scrollElRef}
                />
              )}
              {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
                <FeedSection
                  ref={null}
                  feed={postsWithRepliesFeed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                  scrollElRef={scrollElRef}
                />
              )}
              {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
                <FeedSection
                  ref={null}
                  feed={postsWithMediaFeed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                  scrollElRef={scrollElRef}
                />
              )}
              {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
                <FeedSection
                  ref={null}
                  feed={likesFeed}
                  onScroll={onScroll}
                  headerHeight={headerHeight}
                  isScrolledDown={isScrolledDown}
                  scrollElRef={scrollElRef}
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
          accessibilityLabel={_(msg`New post`)}
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
  scrollElRef: any /* TODO */
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {feed, onScroll, headerHeight, isScrolledDown, scrollElRef},
    ref,
  ) {
    const hasNew = feed.hasNewLatest && !feed.isRefreshing

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
