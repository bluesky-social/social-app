import React, {useCallback, useMemo} from 'react'
import {Pressable, StyleSheet, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused, useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {HITSLOP_20} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {usePalette} from '#/lib/hooks/usePalette'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {makeCustomFeedLink} from '#/lib/routes/links'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {listenSoftReset} from '#/state/events'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {FeedSourceFeedInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
  useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useComposerControls} from '#/state/shell/composer'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {Feed} from '#/view/com/posts/Feed'
import {ProfileSubpageHeader} from '#/view/com/profile/ProfileSubpageHeader'
import {EmptyState} from '#/view/com/util/EmptyState'
import {FAB} from '#/view/com/util/fab/FAB'
import {Button} from '#/view/com/util/forms/Button'
import {ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {LoadingScreen} from '#/view/com/util/LoadingScreen'
import {Text} from '#/view/com/util/text/Text'
import * as Toast from '#/view/com/util/Toast'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Button as NewButton, ButtonText} from '#/components/Button'
import {useRichText} from '#/components/hooks/useRichText'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartOutline,
} from '#/components/icons/Heart2'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
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
      <Layout.Screen testID="profileFeedScreenError">
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
      </Layout.Screen>
    )
  }

  return resolvedUri ? (
    <Layout.Screen>
      <ProfileFeedScreenIntermediate feedUri={resolvedUri.uri} />
    </Layout.Screen>
  ) : (
    <Layout.Screen>
      <LoadingScreen />
    </Layout.Screen>
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
  const playHaptic = useHaptics()
  const feedSectionRef = React.useRef<SectionRef>(null)
  const isScreenFocused = useIsFocused()

  const {mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending} =
    useAddSavedFeedsMutation()
  const {mutateAsync: removeFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: updateSavedFeeds, isPending: isUpdateFeedPending} =
    useUpdateSavedFeedsMutation()

  const isPending =
    isAddSavedFeedPending || isRemovePending || isUpdateFeedPending
  const savedFeedConfig = preferences.savedFeeds.find(
    f => f.value === feedInfo.uri,
  )
  const isSaved = Boolean(savedFeedConfig)
  const isPinned = Boolean(savedFeedConfig?.pinned)

  useSetTitle(feedInfo?.displayName)

  // event handlers
  //

  const onToggleSaved = React.useCallback(async () => {
    try {
      playHaptic()

      if (savedFeedConfig) {
        await removeFeed(savedFeedConfig)
        Toast.show(_(msg`Removed from your feeds`))
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: feedInfo.uri,
            pinned: false,
          },
        ])
        Toast.show(_(msg`Saved to your feeds`))
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        'xmark',
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }, [_, playHaptic, feedInfo, removeFeed, addSavedFeeds, savedFeedConfig])

  const onTogglePinned = React.useCallback(async () => {
    try {
      playHaptic()

      if (savedFeedConfig) {
        await updateSavedFeeds([
          {
            ...savedFeedConfig,
            pinned: !savedFeedConfig.pinned,
          },
        ])
      } else {
        await addSavedFeeds([
          {
            type: 'feed',
            value: feedInfo.uri,
            pinned: true,
          },
        ])
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }, [
    playHaptic,
    feedInfo,
    _,
    savedFeedConfig,
    updateSavedFeeds,
    addSavedFeeds,
  ])

  const onPressShare = React.useCallback(() => {
    const url = toShareUrl(feedInfo.route.href)
    shareUrl(url)
  }, [feedInfo])

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
                disabled={isPending}
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
                        t.atoms.bg_contrast_25,
                        (state.hovered || state.pressed) && [
                          t.atoms.bg_contrast_50,
                        ],
                      ]}
                      testID="headerDropdownBtn">
                      <FontAwesomeIcon
                        icon="ellipsis"
                        size={20}
                        style={t.atoms.text}
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
                        disabled={isPending}
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
    isSaved,
    onPressReport,
    onPressShare,
    t,
    isPending,
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
    const {hasSession} = useSession()
    const feedFeedback = useFeedFeedback(feed, hasSession)

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
      return <EmptyState icon="hashtag" message={_(msg`This feed is empty.`)} />
    }, [_])

    return (
      <View>
        <FeedFeedbackProvider value={feedFeedback}>
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
        </FeedFeedbackProvider>
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
  const playHaptic = useHaptics()
  const {mutateAsync: likeFeed, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeFeed, isPending: isUnlikePending} =
    useUnlikeMutation()
  const [resolvedRT] = useRichText(feedInfo.description.text || '')

  const isLiked = !!likeUri
  const likeCount =
    isLiked && likeUri ? (feedInfo.likeCount || 0) + 1 : feedInfo.likeCount

  const onToggleLiked = React.useCallback(async () => {
    try {
      playHaptic()

      if (isLiked && likeUri) {
        await unlikeFeed({uri: likeUri})
        setLikeUri('')
      } else {
        const res = await likeFeed({uri: feedInfo.uri, cid: feedInfo.cid})
        setLikeUri(res.uri)
      }
    } catch (err) {
      Toast.show(
        _(
          msg`There was an issue contacting the server, please check your internet connection and try again.`,
        ),
        'xmark',
      )
      logger.error('Failed to toggle like', {message: err})
    }
  }, [playHaptic, isLiked, likeUri, unlikeFeed, likeFeed, feedInfo, _])

  return (
    <View style={[styles.aboutSectionContainer]}>
      <View style={[a.pt_sm]}>
        {feedInfo.description ? (
          <RichText
            testID="listDescription"
            style={[a.text_md]}
            value={resolvedRT ?? feedInfo.description}
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
          <InlineLinkText
            label={_(msg`View users who like this feed`)}
            to={makeCustomFeedLink(feedOwnerDid, feedRkey, 'liked-by')}
            style={[t.atoms.text_contrast_medium, a.font_bold]}>
            <Plural
              value={likeCount}
              one="Liked by # user"
              other="Liked by # users"
            />
          </InlineLinkText>
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
