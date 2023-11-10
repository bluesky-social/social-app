import React, {useMemo, useCallback} from 'react'
import {
  Dimensions,
  StyleSheet,
  View,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {Feed} from 'view/com/posts/Feed'
import {TextLink} from 'view/com/util/Link'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {FAB} from 'view/com/util/fab/FAB'
import {EmptyState} from 'view/com/util/EmptyState'
import * as Toast from 'view/com/util/Toast'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {OnScrollHandler} from 'lib/hooks/useOnMainScroll'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'
import {Haptics} from 'lib/haptics'
import {useAnalytics} from 'lib/analytics/analytics'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
import {resolveName} from 'lib/api'
import {makeCustomFeedLink} from 'lib/routes/links'
import {pluralize} from 'lib/strings/helpers'
import {CenteredView, ScrollView} from 'view/com/util/Views'
import {NavigationProp} from 'lib/routes/types'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {ComposeIcon2} from 'lib/icons'
import {logger} from '#/logger'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'

const SECTION_TITLES = ['Posts', 'About']

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeed'>
export const ProfileFeedScreen = withAuthRequired(
  observer(function ProfileFeedScreenImpl(props: Props) {
    const pal = usePalette('default')
    const store = useStores()
    const {_} = useLingui()
    const navigation = useNavigation<NavigationProp>()

    const {name: handleOrDid} = props.route.params

    const [feedOwnerDid, setFeedOwnerDid] = React.useState<string | undefined>()
    const [error, setError] = React.useState<string | undefined>()

    const onPressBack = React.useCallback(() => {
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Home')
      }
    }, [navigation])

    React.useEffect(() => {
      /*
       * We must resolve the DID of the feed owner before we can fetch the feed.
       */
      async function fetchDid() {
        try {
          const did = await resolveName(store, handleOrDid)
          setFeedOwnerDid(did)
        } catch (e) {
          setError(
            `We're sorry, but we were unable to resolve this feed. If this persists, please contact the feed creator, @${handleOrDid}.`,
          )
        }
      }

      fetchDid()
    }, [store, handleOrDid, setFeedOwnerDid])

    if (error) {
      return (
        <CenteredView>
          <View style={[pal.view, pal.border, styles.notFoundContainer]}>
            <Text type="title-lg" style={[pal.text, s.mb10]}>
              <Trans>Could not load feed</Trans>
            </Text>
            <Text type="md" style={[pal.text, s.mb20]}>
              {error}
            </Text>

            <View style={{flexDirection: 'row'}}>
              <Button
                type="default"
                accessibilityLabel={_(msg`Go Back`)}
                accessibilityHint="Return to previous page"
                onPress={onPressBack}
                style={{flexShrink: 1}}>
                <Text type="button" style={pal.text}>
                  <Trans>Go Back</Trans>
                </Text>
              </Button>
            </View>
          </View>
        </CenteredView>
      )
    }

    return feedOwnerDid ? (
      <ProfileFeedScreenInner {...props} feedOwnerDid={feedOwnerDid} />
    ) : (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }),
)

export const ProfileFeedScreenInner = observer(
  function ProfileFeedScreenInnerImpl({
    route,
    feedOwnerDid,
  }: Props & {feedOwnerDid: string}) {
    const {openModal} = useModalControls()
    const pal = usePalette('default')
    const store = useStores()
    const {track} = useAnalytics()
    const {_} = useLingui()
    const feedSectionRef = React.useRef<SectionRef>(null)
    const {rkey, name: handleOrDid} = route.params
    const uri = useMemo(
      () => makeRecordUri(feedOwnerDid, 'app.bsky.feed.generator', rkey),
      [rkey, feedOwnerDid],
    )
    const feedInfo = useCustomFeed(uri)
    const feed: PostsFeedModel = useMemo(() => {
      const model = new PostsFeedModel(store, 'custom', {
        feed: uri,
      })
      model.setup()
      return model
    }, [store, uri])
    const isPinned = store.preferences.isPinnedFeed(uri)
    useSetTitle(feedInfo?.displayName)

    // events
    // =

    const onToggleSaved = React.useCallback(async () => {
      try {
        Haptics.default()
        if (feedInfo?.isSaved) {
          await feedInfo?.unsave()
        } else {
          await feedInfo?.save()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue updating your feeds, please check your internet connection and try again.',
        )
        logger.error('Failed up update feeds', {error: err})
      }
    }, [feedInfo])

    const onToggleLiked = React.useCallback(async () => {
      Haptics.default()
      try {
        if (feedInfo?.isLiked) {
          await feedInfo?.unlike()
        } else {
          await feedInfo?.like()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue contacting the server, please check your internet connection and try again.',
        )
        logger.error('Failed up toggle like', {error: err})
      }
    }, [feedInfo])

    const onTogglePinned = React.useCallback(async () => {
      Haptics.default()
      if (feedInfo) {
        feedInfo.togglePin().catch(e => {
          Toast.show('There was an issue contacting the server')
          logger.error('Failed to toggle pinned feed', {error: e})
        })
      }
    }, [feedInfo])

    const onPressShare = React.useCallback(() => {
      const url = toShareUrl(`/profile/${handleOrDid}/feed/${rkey}`)
      shareUrl(url)
      track('CustomFeed:Share')
    }, [handleOrDid, rkey, track])

    const onPressReport = React.useCallback(() => {
      if (!feedInfo) return
      openModal({
        name: 'report',
        uri: feedInfo.uri,
        cid: feedInfo.cid,
      })
    }, [openModal, feedInfo])

    const onCurrentPageSelected = React.useCallback(
      (index: number) => {
        if (index === 0) {
          feedSectionRef.current?.scrollToTop()
        }
      },
      [feedSectionRef],
    )

    // render
    // =

    const dropdownItems: DropdownItem[] = React.useMemo(() => {
      return [
        {
          testID: 'feedHeaderDropdownToggleSavedBtn',
          label: feedInfo?.isSaved ? 'Remove from my feeds' : 'Add to my feeds',
          onPress: onToggleSaved,
          icon: feedInfo?.isSaved
            ? {
                ios: {
                  name: 'trash',
                },
                android: 'ic_delete',
                web: ['far', 'trash-can'],
              }
            : {
                ios: {
                  name: 'plus',
                },
                android: '',
                web: 'plus',
              },
        },
        {
          testID: 'feedHeaderDropdownReportBtn',
          label: 'Report feed',
          onPress: onPressReport,
          icon: {
            ios: {
              name: 'exclamationmark.triangle',
            },
            android: 'ic_menu_report_image',
            web: 'circle-exclamation',
          },
        },
        {
          testID: 'feedHeaderDropdownShareBtn',
          label: 'Share link',
          onPress: onPressShare,
          icon: {
            ios: {
              name: 'square.and.arrow.up',
            },
            android: 'ic_menu_share',
            web: 'share',
          },
        },
      ] as DropdownItem[]
    }, [feedInfo, onToggleSaved, onPressReport, onPressShare])

    const renderHeader = useCallback(() => {
      return (
        <ProfileSubpageHeader
          isLoading={!feedInfo?.hasLoaded}
          href={makeCustomFeedLink(feedOwnerDid, rkey)}
          title={feedInfo?.displayName}
          avatar={feedInfo?.avatar}
          isOwner={feedInfo?.isOwner}
          creator={
            feedInfo
              ? {did: feedInfo.creatorDid, handle: feedInfo.creatorHandle}
              : undefined
          }
          avatarType="algo">
          {feedInfo && (
            <>
              <Button
                type="default"
                label={feedInfo?.isSaved ? 'Unsave' : 'Save'}
                onPress={onToggleSaved}
                style={styles.btn}
              />
              <Button
                type={isPinned ? 'default' : 'inverted'}
                label={isPinned ? 'Unpin' : 'Pin to home'}
                onPress={onTogglePinned}
                style={styles.btn}
              />
            </>
          )}
          <NativeDropdown
            testID="headerDropdownBtn"
            items={dropdownItems}
            accessibilityLabel={_(msg`More options`)}
            accessibilityHint="">
            <View style={[pal.viewLight, styles.btn]}>
              <FontAwesomeIcon
                icon="ellipsis"
                size={20}
                color={pal.colors.text}
              />
            </View>
          </NativeDropdown>
        </ProfileSubpageHeader>
      )
    }, [
      pal,
      feedOwnerDid,
      rkey,
      feedInfo,
      isPinned,
      onTogglePinned,
      onToggleSaved,
      dropdownItems,
      _,
    ])

    return (
      <View style={s.hContentRegion}>
        <PagerWithHeader
          items={SECTION_TITLES}
          isHeaderReady={feedInfo?.hasLoaded ?? false}
          renderHeader={renderHeader}
          onCurrentPageSelected={onCurrentPageSelected}>
          {({onScroll, headerHeight, isScrolledDown, scrollElRef}) => (
            <FeedSection
              ref={feedSectionRef}
              feed={feed}
              onScroll={onScroll}
              headerHeight={headerHeight}
              isScrolledDown={isScrolledDown}
              scrollElRef={
                scrollElRef as React.MutableRefObject<FlatList<any> | null>
              }
            />
          )}
          {({onScroll, headerHeight, scrollElRef}) => (
            <AboutSection
              feedOwnerDid={feedOwnerDid}
              feedRkey={rkey}
              feedInfo={feedInfo}
              headerHeight={headerHeight}
              onToggleLiked={onToggleLiked}
              onScroll={onScroll}
              scrollElRef={
                scrollElRef as React.MutableRefObject<ScrollView | null>
              }
            />
          )}
        </PagerWithHeader>
        <FAB
          testID="composeFAB"
          onPress={() => store.shell.openComposer({})}
          icon={
            <ComposeIcon2
              strokeWidth={1.5}
              size={29}
              style={{color: 'white'}}
            />
          }
          accessibilityRole="button"
          accessibilityLabel={_(msg`New post`)}
          accessibilityHint=""
        />
      </View>
    )
  },
)

interface FeedSectionProps {
  feed: PostsFeedModel
  onScroll: OnScrollHandler
  headerHeight: number
  isScrolledDown: boolean
  scrollElRef: React.MutableRefObject<FlatList<any> | null>
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl(
    {feed, onScroll, headerHeight, isScrolledDown, scrollElRef},
    ref,
  ) {
    const hasNew = feed.hasNewLatest && !feed.isRefreshing

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({offset: -headerHeight})
      feed.refresh()
    }, [feed, scrollElRef, headerHeight])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    return (
      <View>
        <Feed
          feed={feed}
          scrollElRef={scrollElRef}
          onScroll={onScroll}
          scrollEventThrottle={5}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label="Load new posts"
            showIndicator={hasNew}
          />
        )}
      </View>
    )
  },
)

const AboutSection = observer(function AboutPageImpl({
  feedOwnerDid,
  feedRkey,
  feedInfo,
  headerHeight,
  onToggleLiked,
  onScroll,
  scrollElRef,
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: FeedSourceModel | undefined
  headerHeight: number
  onToggleLiked: () => void
  onScroll: OnScrollHandler
  scrollElRef: React.MutableRefObject<ScrollView | null>
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const scrollHandler = useAnimatedScrollHandler(onScroll)

  if (!feedInfo) {
    return <View />
  }

  return (
    <ScrollView
      ref={scrollElRef}
      scrollEventThrottle={1}
      contentContainerStyle={{
        paddingTop: headerHeight,
        minHeight: Dimensions.get('window').height * 1.5,
      }}
      onScroll={scrollHandler}>
      <View
        style={[
          {
            borderTopWidth: 1,
            paddingVertical: 20,
            paddingHorizontal: 20,
            gap: 12,
          },
          pal.border,
        ]}>
        {feedInfo.descriptionRT ? (
          <RichText
            testID="listDescription"
            type="lg"
            style={pal.text}
            richText={feedInfo.descriptionRT}
          />
        ) : (
          <Text type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
            <Trans>No description</Trans>
          </Text>
        )}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
          <Button
            type="default"
            testID="toggleLikeBtn"
            accessibilityLabel={_(msg`Like this feed`)}
            accessibilityHint=""
            onPress={onToggleLiked}
            style={{paddingHorizontal: 10}}>
            {feedInfo?.isLiked ? (
              <HeartIconSolid size={19} style={styles.liked} />
            ) : (
              <HeartIcon strokeWidth={3} size={19} style={pal.textLight} />
            )}
          </Button>
          {typeof feedInfo.likeCount === 'number' && (
            <TextLink
              href={makeCustomFeedLink(feedOwnerDid, feedRkey, 'liked-by')}
              text={`Liked by ${feedInfo.likeCount} ${pluralize(
                feedInfo.likeCount,
                'user',
              )}`}
              style={[pal.textLight, s.semiBold]}
            />
          )}
        </View>
        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          Created by{' '}
          {feedInfo.isOwner ? (
            'you'
          ) : (
            <TextLink
              text={sanitizeHandle(feedInfo.creatorHandle, '@')}
              href={makeProfileLink({
                did: feedInfo.creatorDid,
                handle: feedInfo.creatorHandle,
              })}
              style={pal.textLight}
            />
          )}
        </Text>
      </View>
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginLeft: 6,
  },
  liked: {
    color: colors.red3,
  },
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
})
