import React, {useCallback, useMemo} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_20} from '#/lib/constants'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedSourceFeedInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  usePinFeedMutation,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
  useSaveFeedMutation,
  useUnpinFeedMutation,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {useAnalytics} from 'lib/analytics/analytics'
import {Haptics} from 'lib/haptics'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {ComposeIcon2} from 'lib/icons'
import {makeCustomFeedLink} from 'lib/routes/links'
import {CommonNavigatorParams} from 'lib/routes/types'
import {NavigationProp} from 'lib/routes/types'
import {shareUrl} from 'lib/sharing'
import {pluralize} from 'lib/strings/helpers'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {toShareUrl} from 'lib/strings/url-helpers'
import {s} from 'lib/styles'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {Feed} from 'view/com/posts/Feed'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {EmptyState} from 'view/com/util/EmptyState'
import {FAB} from 'view/com/util/fab/FAB'
import {Button} from 'view/com/util/forms/Button'
import {ListRef} from 'view/com/util/List'
import {LoadLatestBtn} from 'view/com/util/load-latest/LoadLatestBtn'
import {LoadingScreen} from 'view/com/util/LoadingScreen'
import {Text} from 'view/com/util/text/Text'
import * as Toast from 'view/com/util/Toast'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button as NewButton, ButtonText} from '#/components/Button'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {DotGrid_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartOutline,
} from '#/components/icons/Heart2'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {InlineLink} from '#/components/Link'
import * as Menu from '#/components/Menu'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'
import {RichText} from '#/components/RichText'

const SECTION_TITLES = ['Posts']

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
              accessibilityLabel={_(msg`Go back`)}
              accessibilityHint={_(msg`Returns to previous page`)}
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
    <LoadingScreen />
  )
}

function ProfileFeedScreenIntermediate({feedUri}: {feedUri: string}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: info} = useFeedSourceInfoQuery({uri: feedUri})

  if (!preferences || !info) {
    return <LoadingScreen />
  }

  return (
    <ProfileFeedScreenInner
      preferences={preferences}
      feedInfo={info as FeedSourceFeedInfo}
    />
  )
}

export function ProfileFeedScreenInner({
  preferences,
  feedInfo,
}: {
  preferences: UsePreferencesQueryResponse
  feedInfo: FeedSourceFeedInfo
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {hasSession, currentAccount} = useSession()
  const reportDialogControl = useReportDialogControl()
  const {openComposer} = useComposerControls()
  const {track} = useAnalytics()
  const feedSectionRef = React.useRef<SectionRef>(null)
  const isScreenFocused = useIsFocused()

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

  // event handlers
  //

  const onToggleSaved = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isSaved) {
        await removeFeed({uri: feedInfo.uri})
        resetRemoveFeed()
        Toast.show(_(msg`Removed from your feeds`))
      } else {
        await saveFeed({uri: feedInfo.uri})
        resetSaveFeed()
        Toast.show(_(msg`Saved to your feeds`))
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an an issue updating your feeds, please check your internet connection and try again.`,
        ),
      )
      logger.error('Failed up update feeds', {message: err})
    }
  }, [
    feedInfo,
    isSaved,
    saveFeed,
    removeFeed,
    resetSaveFeed,
    resetRemoveFeed,
    _,
  ])

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
      Toast.show(_(msg`There was an issue contacting the server`))
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [isPinned, feedInfo, pinFeed, unpinFeed, resetPinFeed, resetUnpinFeed, _])

  const onPressShare = React.useCallback(() => {
    const url = toShareUrl(feedInfo.route.href)
    shareUrl(url)
    track('CustomFeed:Share')
  }, [feedInfo, track])

  const onPressReport = React.useCallback(() => {
    reportDialogControl.open()
  }, [reportDialogControl])

  const onCurrentPageSelected = React.useCallback(
    (index: number) => {
      if (index === 0) {
        feedSectionRef.current?.scrollToTop()
      }
    },
    [feedSectionRef],
  )

  const renderHeader = useCallback(() => {
    return (
      <>
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
          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
            {feedInfo && hasSession && (
              <NewButton
                testID={isPinned ? 'unpinBtn' : 'pinBtn'}
                disabled={isPinPending || isUnpinPending}
                size="small"
                variant="solid"
                color={isPinned ? 'secondary' : 'primary'}
                label={isPinned ? _(msg`Unpin from home`) : _(msg`Pin to home`)}
                onPress={onTogglePinned}>
                <ButtonText>
                  {isPinned ? _(msg`Unpin`) : _(msg`Pin to Home`)}
                </ButtonText>
              </NewButton>
            )}
            <Menu.Root>
              <Menu.Trigger label={_(msg`Open feed options menu`)}>
                {({props, state}) => {
                  return (
                    <Pressable
                      {...props}
                      hitSlop={HITSLOP_20}
                      style={[
                        a.justify_center,
                        a.align_center,
                        a.rounded_full,
                        {height: 36, width: 36},
                        t.atoms.bg_contrast_50,
                        (state.hovered || state.pressed) && [
                          t.atoms.bg_contrast_100,
                        ],
                      ]}
                      testID="headerDropdownBtn">
                      <Ellipsis
                        size="lg"
                        fill={t.atoms.text_contrast_medium.color}
                      />
                    </Pressable>
                  )
                }}
              </Menu.Trigger>

              <Menu.Outer>
                <Menu.Group>
                  {hasSession && (
                    <>
                      <Menu.Item
                        disabled={isSavePending || isRemovePending}
                        testID="feedHeaderDropdownToggleSavedBtn"
                        label={
                          isSaved
                            ? _(msg`Remove from my feeds`)
                            : _(msg`Save to my feeds`)
                        }
                        onPress={onToggleSaved}>
                        <Menu.ItemText>
                          {isSaved
                            ? _(msg`Remove from my feeds`)
                            : _(msg`Save to my feeds`)}
                        </Menu.ItemText>
                        <Menu.ItemIcon
                          icon={isSaved ? Trash : Plus}
                          position="right"
                        />
                      </Menu.Item>

                      <Menu.Item
                        testID="feedHeaderDropdownReportBtn"
                        label={_(msg`Report feed`)}
                        onPress={onPressReport}>
                        <Menu.ItemText>{_(msg`Report feed`)}</Menu.ItemText>
                        <Menu.ItemIcon icon={CircleInfo} position="right" />
                      </Menu.Item>
                    </>
                  )}

                  <Menu.Item
                    testID="feedHeaderDropdownShareBtn"
                    label={_(msg`Share feed`)}
                    onPress={onPressShare}>
                    <Menu.ItemText>{_(msg`Share feed`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Share} position="right" />
                  </Menu.Item>
                </Menu.Group>
              </Menu.Outer>
            </Menu.Root>
          </View>
        </ProfileSubpageHeader>
        <AboutSection
          feedOwnerDid={feedInfo.creatorDid}
          feedRkey={feedInfo.route.params.rkey}
          feedInfo={feedInfo}
        />
      </>
    )
  }, [
    _,
    hasSession,
    feedInfo,
    isPinned,
    onTogglePinned,
    onToggleSaved,
    currentAccount?.did,
    isPinPending,
    isRemovePending,
    isSavePending,
    isSaved,
    isUnpinPending,
    onPressReport,
    onPressShare,
    t,
  ])

  return (
    <View style={s.hContentRegion}>
      <ReportDialog
        control={reportDialogControl}
        params={{
          type: 'feedgen',
          uri: feedInfo.uri,
          cid: feedInfo.cid,
        }}
      />
      <PagerWithHeader
        items={SECTION_TITLES}
        isHeaderReady={true}
        renderHeader={renderHeader}
        onCurrentPageSelected={onCurrentPageSelected}>
        {({headerHeight, scrollElRef, isFocused}) => (
          <FeedSection
            ref={feedSectionRef}
            feed={`feedgen|${feedInfo.uri}`}
            headerHeight={headerHeight}
            scrollElRef={scrollElRef as ListRef}
            isFocused={isScreenFocused && isFocused}
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

interface FeedSectionProps {
  feed: FeedDescriptor
  headerHeight: number
  scrollElRef: ListRef
  isFocused: boolean
}
const FeedSection = React.forwardRef<SectionRef, FeedSectionProps>(
  function FeedSectionImpl({feed, headerHeight, scrollElRef, isFocused}, ref) {
    const {_} = useLingui()
    const [hasNew, setHasNew] = React.useState(false)
    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const queryClient = useQueryClient()
    const isScreenFocused = useIsFocused()

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

    React.useEffect(() => {
      if (!isScreenFocused) {
        return
      }
      return listenSoftReset(onScrollToTop)
    }, [onScrollToTop, isScreenFocused])

    const renderPostsEmpty = useCallback(() => {
      return <EmptyState icon="feed" message={_(msg`This feed is empty!`)} />
    }, [_])

    return (
      <View>
        <Feed
          enabled={isFocused}
          feed={feed}
          pollInterval={60e3}
          disablePoll={hasNew}
          scrollElRef={scrollElRef}
          onHasNew={setHasNew}
          onScrolledDownChange={setIsScrolledDown}
          renderEmptyState={renderPostsEmpty}
          headerOffset={headerHeight}
        />
        {(isScrolledDown || hasNew) && (
          <LoadLatestBtn
            onPress={onScrollToTop}
            label={_(msg`Load new posts`)}
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
}: {
  feedOwnerDid: string
  feedRkey: string
  feedInfo: FeedSourceFeedInfo
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
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
        _(
          msg`There was an an issue contacting the server, please check your internet connection and try again.`,
        ),
      )
      logger.error('Failed up toggle like', {message: err})
    }
  }, [likeUri, isLiked, feedInfo, likeFeed, unlikeFeed, track, _])

  return (
    <View style={[styles.aboutSectionContainer]}>
      <View style={[a.pt_sm]}>
        {feedInfo.description ? (
          <RichText
            testID="listDescription"
            style={[a.text_md]}
            value={feedInfo.description}
          />
        ) : (
          <Text type="lg" style={[{fontStyle: 'italic'}, pal.textLight]}>
            <Trans>No description</Trans>
          </Text>
        )}
      </View>

      <View style={[a.flex_row, a.gap_sm, a.align_center, a.pb_sm]}>
        <NewButton
          size="small"
          variant="solid"
          color="secondary"
          shape="round"
          label={isLiked ? _(msg`Unlike this feed`) : _(msg`Like this feed`)}
          testID="toggleLikeBtn"
          disabled={!hasSession || isLikePending || isUnlikePending}
          onPress={onToggleLiked}>
          {isLiked ? (
            <HeartFilled size="md" fill={s.likeColor.color} />
          ) : (
            <HeartOutline size="md" fill={t.atoms.text_contrast_medium.color} />
          )}
        </NewButton>
        {typeof likeCount === 'number' && (
          <InlineLink
            label={_(msg`View users who like this feed`)}
            to={makeCustomFeedLink(feedOwnerDid, feedRkey, 'liked-by')}
            style={[t.atoms.text_contrast_medium, a.font_bold]}>
            {_(msg`Liked by ${likeCount} ${pluralize(likeCount, 'user')}`)}
          </InlineLink>
        )}
      </View>
    </View>
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
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  aboutSectionContainer: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    gap: 12,
  },
})
