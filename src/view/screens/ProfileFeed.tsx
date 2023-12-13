import React, {useMemo, useCallback} from 'react'
import {Dimensions, StyleSheet, View, ActivityIndicator} from 'react-native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {colors, s} from 'lib/styles'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {Feed} from 'view/com/posts/Feed'
import {TextLink} from 'view/com/util/Link'
import {ListRef} from 'view/com/util/List'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {FAB} from 'view/com/util/fab/FAB'
import {EmptyState} from 'view/com/util/EmptyState'
import * as Toast from 'view/com/util/Toast'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'
import {Haptics} from 'lib/haptics'
import {useAnalytics} from 'lib/analytics/analytics'
import {NativeDropdown, DropdownItem} from 'view/com/util/forms/NativeDropdown'
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
import {
  useFeedSourceInfoQuery,
  FeedSourceFeedInfo,
  useIsFeedPublicQuery,
} from '#/state/queries/feed'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {
  UsePreferencesQueryResponse,
  usePreferencesQuery,
  useSaveFeedMutation,
  useRemoveFeedMutation,
  usePinFeedMutation,
  useUnpinFeedMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {useComposerControls} from '#/state/shell/composer'
import {truncateAndInvalidate} from '#/state/queries/util'
import {isNative} from '#/platform/detection'

const SECTION_TITLES = ['Posts', 'About']

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFeed'>
export function ProfileFeedScreen(props: Props) {
  const {rkey, name: handleOrDid} = props.route.params

  const pal = usePalette('default')
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const uri = useMemo(
    () => makeRecordUri(handleOrDid, 'app.bsky.feed.generator', rkey),
    [rkey, handleOrDid],
  )
  const {error, data: resolvedUri} = useResolveUriQuery(uri)

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (error) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb10]}>
            <Trans>Could not load feed</Trans>
          </Text>
          <Text type="md" style={[pal.text, s.mb20]}>
            {error.toString()}
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

  return resolvedUri ? (
    <ProfileFeedScreenIntermediate feedUri={resolvedUri.uri} />
  ) : (
    <CenteredView>
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    </CenteredView>
  )
}

function ProfileFeedScreenIntermediate({feedUri}: {feedUri: string}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: info} = useFeedSourceInfoQuery({uri: feedUri})
  const {isLoading: isPublicStatusLoading, data: isPublicResponse} =
    useIsFeedPublicQuery({uri: feedUri})

  if (!preferences || !info || isPublicStatusLoading) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }

  return (
    <ProfileFeedScreenInner
      preferences={preferences}
      feedInfo={info as FeedSourceFeedInfo}
      isPublicResponse={isPublicResponse}
    />
  )
}

export function ProfileFeedScreenInner({
  preferences,
  feedInfo,
  isPublicResponse,
}: {
  preferences: UsePreferencesQueryResponse
  feedInfo: FeedSourceFeedInfo
  isPublicResponse: ReturnType<typeof useIsFeedPublicQuery>['data']
}) {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {hasSession, currentAccount} = useSession()
  const {openModal} = useModalControls()
  const {openComposer} = useComposerControls()
  const {track} = useAnalytics()
  const feedSectionRef = React.useRef<SectionRef>(null)

  const {
    mutateAsync: saveFeed,
    variables: savedFeed,
    reset: resetSaveFeed,
    isPending: isSavePending,
  } = useSaveFeedMutation()
  const {
    mutateAsync: removeFeed,
    variables: removedFeed,
    reset: resetRemoveFeed,
    isPending: isRemovePending,
  } = useRemoveFeedMutation()
  const {
    mutateAsync: pinFeed,
    variables: pinnedFeed,
    reset: resetPinFeed,
    isPending: isPinPending,
  } = usePinFeedMutation()
  const {
    mutateAsync: unpinFeed,
    variables: unpinnedFeed,
    reset: resetUnpinFeed,
    isPending: isUnpinPending,
  } = useUnpinFeedMutation()

  const isSaved =
    !removedFeed &&
    (!!savedFeed || preferences.feeds.saved.includes(feedInfo.uri))
  const isPinned =
    !unpinnedFeed &&
    (!!pinnedFeed || preferences.feeds.pinned.includes(feedInfo.uri))

  useSetTitle(feedInfo?.displayName)

  const onToggleSaved = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isSaved) {
        await removeFeed({uri: feedInfo.uri})
        resetRemoveFeed()
      } else {
        await saveFeed({uri: feedInfo.uri})
        resetSaveFeed()
      }
    } catch (err) {
      Toast.show(
        'There was an an issue updating your feeds, please check your internet connection and try again.',
      )
      logger.error('Failed up update feeds', {error: err})
    }
  }, [feedInfo, isSaved, saveFeed, removeFeed, resetSaveFeed, resetRemoveFeed])

  const onTogglePinned = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isPinned) {
        await unpinFeed({uri: feedInfo.uri})
        resetUnpinFeed()
      } else {
        await pinFeed({uri: feedInfo.uri})
        resetPinFeed()
      }
    } catch (e) {
      Toast.show('There was an issue contacting the server')
      logger.error('Failed to toggle pinned feed', {error: e})
    }
  }, [isPinned, feedInfo, pinFeed, unpinFeed, resetPinFeed, resetUnpinFeed])

  const onPressShare = React.useCallback(() => {
    const url = toShareUrl(feedInfo.route.href)
    shareUrl(url)
    track('CustomFeed:Share')
  }, [feedInfo, track])

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
      hasSession && {
        testID: 'feedHeaderDropdownToggleSavedBtn',
        label: isSaved ? _(msg`Remove from my feeds`) : _(msg`Add to my feeds`),
        onPress: isSavePending || isRemovePending ? undefined : onToggleSaved,
        icon: isSaved
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
      hasSession && {
        testID: 'feedHeaderDropdownReportBtn',
        label: _(msg`Report feed`),
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
        label: _(msg`Share feed`),
        onPress: onPressShare,
        icon: {
          ios: {
            name: 'square.and.arrow.up',
          },
          android: 'ic_menu_share',
          web: 'share',
        },
      },
    ].filter(Boolean) as DropdownItem[]
  }, [
    hasSession,
    onToggleSaved,
    onPressReport,
    onPressShare,
    isSaved,
    isSavePending,
    isRemovePending,
    _,
  ])

  const renderHeader = useCallback(() => {
    return (
      <ProfileSubpageHeader
        isLoading={false}
        href={feedInfo.route.href}
        title={feedInfo?.displayName}
        avatar={feedInfo?.avatar}
        isOwner={feedInfo.creatorDid === currentAccount?.did}
        creator={
          feedInfo
            ? {did: feedInfo.creatorDid, handle: feedInfo.creatorHandle}
            : undefined
        }
        avatarType="algo">
        {feedInfo && hasSession && (
          <>
            <Button
              disabled={isSavePending || isRemovePending}
              type="default"
              label={isSaved ? 'Unsave' : 'Save'}
              onPress={onToggleSaved}
              style={styles.btn}
            />
            <Button
              testID={isPinned ? 'unpinBtn' : 'pinBtn'}
              disabled={isPinPending || isUnpinPending}
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
    _,
    hasSession,
    pal,
    feedInfo,
    isPinned,
    onTogglePinned,
    onToggleSaved,
    dropdownItems,
    currentAccount?.did,
    isPinPending,
    isRemovePending,
    isSavePending,
    isSaved,
    isUnpinPending,
  ])

  return (
    <View style={s.hContentRegion}>
      <PagerWithHeader
        items={SECTION_TITLES}
        isHeaderReady={true}
        renderHeader={renderHeader}
        onCurrentPageSelected={onCurrentPageSelected}>
        {({headerHeight, scrollElRef, isFocused}) =>
          isPublicResponse?.isPublic ? (
            <FeedSection
              ref={feedSectionRef}
              feed={`feedgen|${feedInfo.uri}`}
              headerHeight={headerHeight}
              scrollElRef={scrollElRef as ListRef}
              isFocused={isFocused}
            />
          ) : (
            <CenteredView sideBorders style={[{paddingTop: headerHeight}]}>
              <NonPublicFeedMessage rawError={isPublicResponse?.error} />
            </CenteredView>
          )
        }
        {({headerHeight, scrollElRef}) => (
          <AboutSection
            feedOwnerDid={feedInfo.creatorDid}
            feedRkey={feedInfo.route.params.rkey}
            feedInfo={feedInfo}
            headerHeight={headerHeight}
            scrollElRef={
              scrollElRef as React.MutableRefObject<ScrollView | null>
            }
            isOwner={feedInfo.creatorDid === currentAccount?.did}
          />
        )}
      </PagerWithHeader>
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={() => openComposer({})}
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
      )}
    </View>
  )
}

function NonPublicFeedMessage({rawError}: {rawError?: Error}) {
  const pal = usePalette('default')

  return (
    <View
      style={[
        pal.border,
        {
          padding: 18,
          borderTopWidth: 1,
          minHeight: Dimensions.get('window').height * 1.5,
        },
      ]}>
      <View
        style={[
          pal.viewLight,
          {
            padding: 12,
            borderRadius: 8,
            gap: 12,
          },
        ]}>
        <Text style={[pal.text]}>
          <Trans>
            Looks like this feed is only available to users with a Bluesky
            account. Please sign up or sign in to view this feed!
          </Trans>
        </Text>

        {rawError?.message && (
          <Text style={pal.textLight}>
            <Trans>Message from server</Trans>: {rawError.message}
          </Text>
        )}
      </View>
    </View>
  )
}

interface FeedSectionProps {
  feed: FeedDescriptor
  headerHeight: number
  scrollElRef: ListRef
  isFocused: boolean
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl({feed, headerHeight, scrollElRef, isFocused}, ref) {
    const [hasNew, setHasNew] = React.useState(false)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const queryClient = useQueryClient()

    const onScrollToTop = useCallback(() => {
      scrollElRef.current?.scrollToOffset({
        animated: isNative,
        offset: -headerHeight,
      })
      truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
      setHasNew(false)
    }, [scrollElRef, headerHeight, queryClient, feed, setHasNew])

    React.useImperativeHandle(ref, () => ({
      scrollToTop: onScrollToTop,
    }))

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="feed" message="This feed is empty!" />
    }, [])

    return (
      <View>
        <Feed
          enabled={isFocused}
          feed={feed}
          pollInterval={30e3}
          scrollElRef={scrollElRef}
          onHasNew={setHasNew}
          onScrolledDownChange={setIsScrolledDown}
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

function AboutSection({
  feedOwnerDid,
  feedRkey,
  feedInfo,
  headerHeight,
  scrollElRef,
  isOwner,
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: FeedSourceFeedInfo
  headerHeight: number
  scrollElRef: React.MutableRefObject<ScrollView | null>
  isOwner: boolean
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  // TODO!
  const scrollHandler = useAnimatedScrollHandler(() => {})
  const [likeUri, setLikeUri] = React.useState(feedInfo.likeUri)
  const {hasSession} = useSession()
  const {track} = useAnalytics()
  const {mutateAsync: likeFeed, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeFeed, isPending: isUnlikePending} =
    useUnlikeMutation()

  const isLiked = !!likeUri
  const likeCount =
    isLiked && likeUri ? (feedInfo.likeCount || 0) + 1 : feedInfo.likeCount

  const onToggleLiked = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeFeed({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeFeed({uri: feedInfo.uri, cid: feedInfo.cid})
        track('CustomFeed:Like')
        setLikeUri(res.uri)
      }
    } catch (err) {
      Toast.show(
        'There was an an issue contacting the server, please check your internet connection and try again.',
      )
      logger.error('Failed up toggle like', {error: err})
    }
  }, [likeUri, isLiked, feedInfo, likeFeed, unlikeFeed, track])

  return (
    <ScrollView
      ref={scrollElRef}
      scrollEventThrottle={1}
      contentContainerStyle={{
        paddingTop: headerHeight,
        minHeight: Dimensions.get('window').height * 1.5,
      }}>
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
        {feedInfo.description ? (
          <RichText
            testID="listDescription"
            type="lg"
            style={pal.text}
            richText={feedInfo.description}
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
            disabled={!hasSession || isLikePending || isUnlikePending}
            onPress={onToggleLiked}
            style={{paddingHorizontal: 10}}>
            {isLiked ? (
              <HeartIconSolid size={19} style={styles.liked} />
            ) : (
              <HeartIcon strokeWidth={3} size={19} style={pal.textLight} />
            )}
          </Button>
          {typeof likeCount === 'number' && (
            <TextLink
              href={makeCustomFeedLink(feedOwnerDid, feedRkey, 'liked-by')}
              text={`Liked by ${likeCount} ${pluralize(likeCount, 'user')}`}
              style={[pal.textLight, s.semiBold]}
            />
          )}
        </View>
        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          Created by{' '}
          {isOwner ? (
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
}

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
