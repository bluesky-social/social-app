import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  LayoutAnimation,
  ListRenderItem,
  Pressable,
  ScrollView,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeGesture,
} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import {
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {useEvent} from 'expo'
import {Image, ImageStyle} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {createVideoPlayer, VideoPlayer, VideoView} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  ModerationDecision,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  RouteProp,
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_20} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isAndroid} from '#/platform/detection'
import {POST_TOMBSTONE, Shadow, usePostShadow} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {
  FeedFeedbackProvider,
  useFeedFeedbackContext,
} from '#/state/feed-feedback'
import {useFeedFeedback} from '#/state/feed-feedback'
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {
  AuthorFilter,
  FeedPostSliceItem,
  usePostFeedQuery,
} from '#/state/queries/post-feed'
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSetLightStatusBar} from '#/state/shell/light-status-bar'
import {List} from '#/view/com/util/List'
import {PostCtrls} from '#/view/com/util/post-ctrls/PostCtrls'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Header} from '#/screens/VideoFeed/components/Header'
import {atoms as a, platform, ThemeProvider, useTheme} from '#/alf'
import {setNavigationBar} from '#/alf/util/navigationBar'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {EyeSlash_Stroke2_Corner0_Rounded as Eye} from '#/components/icons/EyeSlash'
import {Leaf_Stroke2_Corner0_Rounded as LeafIcon} from '#/components/icons/Leaf'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import * as Hider from '#/components/moderation/Hider'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import {Scrubber, ScrubberPlaceholder} from './components/Scrubber'

function createThreeVideoPlayers(
  sources?: [string, string, string],
): [VideoPlayer, VideoPlayer, VideoPlayer] {
  // android is typically slower and can't keep up with a 0.1 interval
  const eventInterval = platform({
    ios: 0.2,
    android: 0.5,
    default: 0,
  })
  const p1 = createVideoPlayer(sources?.[0] ?? '')
  p1.loop = true
  p1.timeUpdateEventInterval = eventInterval
  const p2 = createVideoPlayer(sources?.[1] ?? '')
  p2.loop = true
  p2.timeUpdateEventInterval = eventInterval
  const p3 = createVideoPlayer(sources?.[2] ?? '')
  p3.loop = true
  p3.timeUpdateEventInterval = eventInterval
  return [p1, p2, p3]
}

export function VideoFeed({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'VideoFeed'
>) {
  const {top} = useSafeAreaInsets()
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'VideoFeed'>>()

  const t = useTheme()
  const setMinShellMode = useSetMinimalShellMode()
  useFocusEffect(
    useCallback(() => {
      setMinShellMode(true)
      setNavigationBar('lightbox', t)
      return () => {
        setMinShellMode(false)
        setNavigationBar('theme', t)
      }
    }, [setMinShellMode, t]),
  )

  const isFocused = useIsFocused()
  useSetLightStatusBar(isFocused)

  return (
    <ThemeProvider theme="dark">
      <Layout.Screen noInsetTop style={{backgroundColor: 'black'}}>
        <View
          style={[
            a.absolute,
            a.z_30,
            {top: 0, left: 0, right: 0, paddingTop: top},
          ]}>
          <Header sourceContext={params} />
        </View>
        <Feed />
      </Layout.Screen>
    </ThemeProvider>
  )
}

const viewabilityConfig = {
  itemVisiblePercentThreshold: 100,
  minimumViewTime: 0,
} satisfies ViewabilityConfig

type CurrentSource = {
  source: string
  moderation?: ModerationDecision
} | null

function Feed() {
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'VideoFeed'>>()
  const isFocused = useIsFocused()
  const {hasSession} = useSession()
  const {height} = useSafeAreaFrame()

  const feedDesc = useMemo(() => {
    switch (params.type) {
      case 'feedgen':
        return `feedgen|${params.uri as string}` as const
      case 'author':
        return `author|${params.did as string}|${
          params.filter as AuthorFilter
        }` as const
      default:
        throw new Error(`Invalid video feed params ${JSON.stringify(params)}`)
    }
  }, [params])
  const feedFeedback = useFeedFeedback(feedDesc, hasSession)
  const {data, error, hasNextPage, isFetchingNextPage, fetchNextPage} =
    usePostFeedQuery(feedDesc)

  const videos = useMemo(() => {
    let vids =
      data?.pages
        .flatMap(page => page.slices.flatMap(slice => slice.items))
        .filter(item => AppBskyEmbedVideo.isView(item.post.embed)) || []
    const startingVideoIndex = vids?.findIndex(video => {
      return video.post.uri === params.initialPostUri
    })
    if (vids && startingVideoIndex && startingVideoIndex > -1) {
      vids = vids.slice(startingVideoIndex)
    }
    return vids
  }, [data, params.initialPostUri])

  const [currentSources, setCurrentSources] = useState<
    [CurrentSource, CurrentSource, CurrentSource]
  >([null, null, null])

  const [players, setPlayers] = useState<
    [VideoPlayer, VideoPlayer, VideoPlayer] | null
  >(null)

  const [currentIndex, setCurrentIndex] = useState(0)

  const scrollGesture = useMemo(() => Gesture.Native(), [])

  const renderItem: ListRenderItem<FeedPostSliceItem> = useCallback(
    ({item, index}) => {
      const {post} = item

      // filtered above, here for TS
      if (!post.embed || !AppBskyEmbedVideo.isView(post.embed)) {
        return null
      }

      const player = players?.[index % 3]
      const currentSource = currentSources[index % 3]

      if (!currentSource?.moderation) {
        return null
      }

      return (
        <VideoItem
          player={player}
          post={post}
          embed={post.embed}
          active={
            isFocused &&
            index === currentIndex &&
            currentSource?.source === post.embed.playlist
          }
          moderation={currentSource.moderation}
          scrollGesture={scrollGesture}
        />
      )
    },
    [players, currentIndex, isFocused, currentSources, scrollGesture],
  )

  const updateVideoState = useNonReactiveCallback((index?: number) => {
    if (!videos.length) return

    if (index === undefined) {
      index = currentIndex
    } else {
      setCurrentIndex(index)
    }

    setCurrentSources(oldSources => {
      const currentSources = [...oldSources] as [
        CurrentSource,
        CurrentSource,
        CurrentSource,
      ]

      const prevSlice = videos.at(index - 1)
      const prevPost = prevSlice?.post
      const prevEmbed = prevPost?.embed
      const prevVideo =
        prevEmbed && AppBskyEmbedVideo.isView(prevEmbed)
          ? prevEmbed.playlist
          : null
      const prevVideoModeration = prevSlice?.moderation
      const currSlice = videos.at(index)
      const currPost = currSlice?.post
      const currEmbed = currPost?.embed
      const currVideo =
        currEmbed && AppBskyEmbedVideo.isView(currEmbed)
          ? currEmbed.playlist
          : null
      const currVideoModeration = currSlice?.moderation
      const nextSlice = videos.at(index + 1)
      const nextPost = nextSlice?.post
      const nextEmbed = nextPost?.embed
      const nextVideo =
        nextEmbed && AppBskyEmbedVideo.isView(nextEmbed)
          ? nextEmbed.playlist
          : null
      const nextVideoModeration = nextSlice?.moderation

      const prevPlayerCurrentSource = currentSources[(index + 2) % 3]
      const currPlayerCurrentSource = currentSources[index % 3]
      const nextPlayerCurrentSource = currentSources[(index + 1) % 3]

      if (!players) {
        const args = ['', '', ''] satisfies [string, string, string]
        if (prevVideo) args[(index + 2) % 3] = prevVideo
        if (currVideo) args[index % 3] = currVideo
        if (nextVideo) args[(index + 1) % 3] = nextVideo
        const [player1, player2, player3] = createThreeVideoPlayers(args)

        setPlayers([player1, player2, player3])

        if (currVideo) {
          const currPlayer = [player1, player2, player3][index % 3]
          currPlayer.play()
        }
      } else {
        const [player1, player2, player3] = players

        const prevPlayer = [player1, player2, player3][(index + 2) % 3]
        const currPlayer = [player1, player2, player3][index % 3]
        const nextPlayer = [player1, player2, player3][(index + 1) % 3]

        if (prevVideo && prevVideo !== prevPlayerCurrentSource?.source) {
          prevPlayer.replace(prevVideo)
        }
        prevPlayer.pause()

        if (currVideo) {
          if (currVideo !== currPlayerCurrentSource?.source) {
            currPlayer.replace(currVideo)
          }
          if (
            currVideoModeration &&
            currVideoModeration.ui('contentView').blur
          ) {
            currPlayer.pause()
          } else {
            currPlayer.play()
          }
        }

        if (nextVideo && nextVideo !== nextPlayerCurrentSource?.source) {
          nextPlayer.replace(nextVideo)
        }
        nextPlayer.pause()
      }

      if (prevVideo && prevVideo !== prevPlayerCurrentSource?.source) {
        currentSources[(index + 2) % 3] = {
          source: prevVideo,
          moderation: prevVideoModeration,
        }
      }

      if (currVideo && currVideo !== currPlayerCurrentSource?.source) {
        // TODO should already been calculated, but just in case
        // if (!nextVideoModeration && nextPost && moderationOpts) {
        //   nextVideoModeration = moderatePost(nextPost, moderationOpts)
        // }
        currentSources[index % 3] = {
          source: currVideo,
          moderation: currVideoModeration,
        }
      }

      if (nextVideo && nextVideo !== nextPlayerCurrentSource?.source) {
        currentSources[(index + 1) % 3] = {
          source: nextVideo,
          moderation: nextVideoModeration,
        }
      }

      // use old array if no changes
      if (
        oldSources[0]?.source === currentSources[0]?.source &&
        oldSources[1]?.source === currentSources[1]?.source &&
        oldSources[2]?.source === currentSources[2]?.source
      ) {
        return oldSources
      }
      return currentSources
    })
  })

  useFocusEffect(
    useCallback(() => {
      if (!players) {
        // create players, set sources, start playing
        updateVideoState()
      }
      return () => {
        if (players) {
          // manually release players when offscreen
          players.forEach(p => p.release())
          setPlayers(null)
        }
      }
    }, [players, updateVideoState]),
  )

  const onViewableItemsChanged = useCallback(
    ({viewableItems}: {viewableItems: ViewToken[]; changed: ViewToken[]}) => {
      if (viewableItems[0] && viewableItems[0].index !== null) {
        updateVideoState(viewableItems[0].index)
      }
    },
    [updateVideoState],
  )

  const renderEndMessage = useCallback(() => <EndMessage />, [])

  return (
    <FeedFeedbackProvider value={feedFeedback}>
      <GestureDetector gesture={scrollGesture}>
        <List
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled={true}
          ListFooterComponent={
            <ListFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              error={cleanError(error)}
              onRetry={fetchNextPage}
              height={height}
              showEndMessage
              renderEndMessage={renderEndMessage}
              style={[a.justify_center]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </GestureDetector>
    </FeedFeedbackProvider>
  )
}

function keyExtractor(item: FeedPostSliceItem) {
  return item._reactKey
}

function VideoItem({
  player,
  post,
  embed,
  active,
  scrollGesture,
  moderation,
}: {
  player?: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
  scrollGesture: NativeGesture
  moderation?: ModerationDecision
}) {
  const postShadow = usePostShadow(post)
  const {width, height} = useSafeAreaFrame()
  const {sendInteraction} = useFeedFeedbackContext()

  useEffect(() => {
    let to: NodeJS.Timeout | null = null
    if (active && !to) {
      to = setTimeout(() => {
        sendInteraction({
          item: post.uri,
          event: 'app.bsky.feed.defs#interactionSeen',
        })
      }, 1000)
    } else if (!active && to) {
      clearTimeout(to)
    }
  }, [active, post, sendInteraction])

  return (
    <View style={[a.relative, {height, width}]}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[a.flex_1]}>
        {postShadow === POST_TOMBSTONE ? (
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.z_20,
              a.align_center,
              a.justify_center,
              {backgroundColor: 'rgba(0, 0, 0, 0.8)'},
            ]}>
            <Text
              style={[
                a.text_2xl,
                a.font_heavy,
                a.text_center,
                a.leading_tight,
                a.mx_xl,
              ]}>
              <Trans>Post has been deleted</Trans>
            </Text>
          </View>
        ) : (
          <>
            <VideoItemPlaceholder embed={embed} />
            {player && (
              <VideoItemInner player={player} embed={embed} active={active} />
            )}
            {moderation && (
              <Overlay
                player={player}
                post={postShadow}
                embed={embed}
                active={active}
                scrollGesture={scrollGesture}
                moderation={moderation}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  )
}

function VideoItemInner({
  player,
  embed,
  active,
}: {
  player: VideoPlayer
  embed: AppBskyEmbedVideo.View
  active: boolean
}) {
  const {status} = useEvent(player, 'statusChange', {status: player.status})

  return (
    <>
      {active && player && (
        <VideoView
          style={[
            a.absolute,
            a.inset_0,
            isAndroid && status === 'loading' && {opacity: 0},
          ]}
          player={player}
          nativeControls={false}
          contentFit={
            isTallAspectRatio(embed.aspectRatio) ? 'cover' : 'contain'
          }
          accessibilityIgnoresInvertColors
        />
      )}
    </>
  )
}

function ModerationOverlay({
  embed,
  onPressShow,
}: {
  embed: AppBskyEmbedVideo.View
  onPressShow: () => void
}) {
  const hider = Hider.useHider()
  const {_} = useLingui()

  const onShow = useCallback(() => {
    hider.setIsContentVisible(true)
    onPressShow()
  }, [hider, onPressShow])

  return (
    <View style={[a.absolute, a.inset_0, a.z_20]}>
      <VideoItemPlaceholder blur embed={embed} />
      <View
        style={[
          a.absolute,
          a.inset_0,
          a.z_20,
          a.justify_center,
          a.align_center,
        ]}>
        <View style={[a.align_center, a.gap_sm]}>
          <Eye width={36} fill="white" />
          <Text style={[a.text_center, a.leading_snug, a.pb_xs]}>
            <Trans>Hidden by your moderation settings.</Trans>
          </Text>
          <Button
            label={_(msg`Show anyway`)}
            size="small"
            variant="solid"
            color="secondary_inverted"
            onPress={onShow}>
            <ButtonText>
              <Trans>Show anyway</Trans>
            </ButtonText>
          </Button>
        </View>

        <View
          style={[
            a.absolute,
            a.inset_0,
            a.px_xl,
            a.pt_4xl,
            {
              top: 'auto',
            },
          ]}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
            style={[a.absolute, a.inset_0]}
          />
          <Divider style={{backgroundColor: 'white'}} />
          <View style={[]}>
            <Button
              label={_(msg`View details`)}
              onPress={() => {
                hider.showInfoDialog()
              }}
              style={[
                a.w_full,
                {
                  height: 60,
                },
              ]}>
              {({pressed}) => (
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    a.text_center,
                    {opacity: pressed ? 0.5 : 1},
                  ]}>
                  <Trans>View details</Trans>
                </Text>
              )}
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}

function Overlay({
  player,
  post,
  embed,
  active,
  scrollGesture,
  moderation,
}: {
  player?: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
  embed: AppBskyEmbedVideo.View
  active: boolean
  scrollGesture: NativeGesture
  moderation: ModerationDecision
}) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const seekingAnimationSV = useSharedValue(0)

  const profile = useProfileShadow(post.author)
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    'ImmersiveVideo',
  )

  const rkey = new AtUri(post.uri).rkey
  const record = AppBskyFeedPost.isRecord(post.record) ? post.record : undefined
  const richText = new RichTextAPI({
    text: record?.text || '',
    facets: record?.facets,
  })

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - seekingAnimationSV.get(),
  }))

  const onPressShow = useCallback(() => {
    player?.play()
  }, [player])

  return (
    <Hider.Outer modui={moderation.ui('contentView')}>
      <Hider.Mask>
        <ModerationOverlay embed={embed} onPressShow={onPressShow} />
      </Hider.Mask>
      <Hider.Content>
        <View style={[a.absolute, a.inset_0, a.z_20]}>
          <View style={[a.flex_1]}>
            <PlayPauseTapArea player={player} post={post} />
          </View>

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={[a.w_full, a.pt_md]}>
            <Animated.View style={[a.px_xl, animatedStyle]}>
              <View style={[a.w_full, a.flex_row, a.align_center, a.gap_md]}>
                <Link
                  label={_(
                    msg`View ${sanitizeDisplayName(
                      post.author.displayName || post.author.handle,
                    )}'s profile`,
                  )}
                  to={{
                    screen: 'Profile',
                    params: {name: post.author.did},
                  }}
                  style={[a.flex_1, a.flex_row, a.gap_md, a.align_center]}>
                  <UserAvatar
                    type="user"
                    avatar={post.author.avatar}
                    size={32}
                  />
                  <View style={[a.flex_1]}>
                    <Text
                      style={[a.text_md, a.font_heavy]}
                      emoji
                      numberOfLines={1}>
                      {sanitizeDisplayName(
                        post.author.displayName || post.author.handle,
                      )}
                    </Text>
                    <Text
                      style={[a.text_sm, t.atoms.text_contrast_high]}
                      numberOfLines={1}>
                      {sanitizeHandle(post.author.handle, '@')}
                    </Text>
                  </View>
                </Link>
                {/* show button based on non-reactive version, so it doesn't hide on press */}
                {!post.author.viewer?.following && (
                  <Button
                    label={
                      profile.viewer?.following
                        ? _(msg`Following`)
                        : _(msg`Follow`)
                    }
                    accessibilityHint={
                      profile.viewer?.following ? _(msg`Unfollow user`) : ''
                    }
                    size="small"
                    variant="outline"
                    color="secondary_inverted"
                    style={[a.mb_xs, a.bg_transparent]}
                    onPress={() =>
                      profile.viewer?.following
                        ? queueUnfollow()
                        : queueFollow()
                    }>
                    {!!profile.viewer?.following && (
                      <ButtonIcon icon={CheckIcon} />
                    )}
                    <ButtonText>
                      {profile.viewer?.following ? (
                        <Trans>Following</Trans>
                      ) : (
                        <Trans>Follow</Trans>
                      )}
                    </ButtonText>
                  </Button>
                )}
              </View>
              {record?.text?.trim() && (
                <ExpandableRichTextView
                  value={richText}
                  authorHandle={post.author.handle}
                />
              )}
              {record && (
                <View style={[{left: -5}]}>
                  <PostCtrls
                    richText={richText}
                    post={post}
                    record={record}
                    logContext="FeedItem"
                    onPressReply={() =>
                      navigation.navigate('PostThread', {
                        name: post.author.did,
                        rkey,
                      })
                    }
                    big
                  />
                </View>
              )}
            </Animated.View>

            {player && active ? (
              <Scrubber
                player={player}
                seekingAnimationSV={seekingAnimationSV}
                scrollGesture={scrollGesture}
              />
            ) : (
              <ScrubberPlaceholder />
            )}
          </LinearGradient>
        </View>
        {/*
        {isAndroid && status === 'loading' && (
          <View
            style={[
              a.absolute,
              a.inset_0,
              a.align_center,
              a.justify_center,
              a.z_10,
            ]}
            pointerEvents="none">
            <Loader size="2xl" />
          </View>
        )}
          */}
      </Hider.Content>
    </Hider.Outer>
  )
}

function ExpandableRichTextView({
  value,
  authorHandle,
}: {
  value: RichTextAPI
  authorHandle?: string
}) {
  const {height: screenHeight} = useSafeAreaFrame()
  const [expanded, setExpanded] = useState(false)
  const [constrained, setConstrained] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const {_} = useLingui()

  return (
    <ScrollView
      scrollEnabled={expanded}
      onContentSizeChange={(_w, h) => {
        if (expanded) {
          LayoutAnimation.configureNext({
            duration: 500,
            update: {type: 'spring', springDamping: 0.6},
          })
        }
        setContentHeight(h)
      }}
      style={{height: Math.min(contentHeight, screenHeight * 0.5)}}
      contentContainerStyle={[
        a.py_sm,
        a.gap_xs,
        expanded ? [a.align_start] : a.flex_row,
      ]}>
      <RichText
        value={value}
        style={[a.text_sm, a.flex_1, a.leading_normal]}
        authorHandle={authorHandle}
        enableTags
        numberOfLines={expanded ? undefined : constrained ? 2 : 2}
        onTextLayout={evt => {
          if (!constrained && evt.nativeEvent.lines.length > 1) {
            setConstrained(true)
          }
        }}
      />
      {constrained && (
        <Pressable
          accessibilityHint={_(msg`Tap to expand or collapse post text.`)}
          accessibilityLabel={expanded ? _(msg`Read less`) : _(msg`Read more`)}
          hitSlop={HITSLOP_20}
          onPress={() => setExpanded(prev => !prev)}
          style={[a.absolute, a.inset_0]}
        />
      )}
    </ScrollView>
  )
}

function VideoItemPlaceholder({
  embed,
  style,
  blur,
}: {
  embed: AppBskyEmbedVideo.View
  style?: ImageStyle
  blur?: boolean
}) {
  const src = embed.thumbnail
  let contentFit = isTallAspectRatio(embed.aspectRatio)
    ? ('cover' as const)
    : ('contain' as const)
  if (blur) {
    contentFit = 'cover' as const
  }
  return src ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{uri: src}}
      style={[a.absolute, a.inset_0, style]}
      contentFit={contentFit}
      blurRadius={blur ? 40 : 0}
    />
  ) : null
}

function PlayPauseTapArea({
  player,
  post,
}: {
  player?: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
}) {
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playHaptic = useHaptics()
  const [queueLike] = usePostLikeMutationQueue(post, 'ImmersiveVideo')

  const {sendInteraction} = useFeedFeedbackContext()

  const togglePlayPause = () => {
    if (!player) return
    doubleTapRef.current = null
    if (player.playing) {
      player.pause()
    } else {
      player.play()
    }
  }

  const onPress = () => {
    if (doubleTapRef.current) {
      clearTimeout(doubleTapRef.current)
      doubleTapRef.current = null
      playHaptic('Light')
      queueLike()
      sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#interactionLike',
      })
    } else {
      doubleTapRef.current = setTimeout(togglePlayPause, 200)
    }
  }

  return (
    <Button
      disabled={!player}
      label="Toggle play/pause"
      accessibilityHint="Double tap to like"
      onPress={onPress}
      style={[a.absolute, a.inset_0]}>
      <View />
    </Button>
  )
}

function EndMessage() {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.gap_3xl,
        a.px_lg,
        a.mx_auto,
        a.align_center,
        {maxWidth: 350},
      ]}>
      <View
        style={[
          {height: 100, width: 100},
          a.rounded_full,
          t.atoms.bg_contrast_700,
          a.align_center,
          a.justify_center,
        ]}>
        <LeafIcon width={64} fill="black" />
      </View>
      <View style={[a.w_full, a.gap_md]}>
        <Text style={[a.text_3xl, a.text_center, a.font_heavy]}>
          <Trans>That's everything!</Trans>
        </Text>
        <Text
          style={[
            a.text_lg,
            a.text_center,
            t.atoms.text_contrast_high,
            a.leading_snug,
          ]}>
          <Trans>
            You've run out of videos to watch. Maybe it's a good time to take a
            break?
          </Trans>
        </Text>
      </View>
      <Button
        testID="videoFeedGoBackButton"
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack()
          } else {
            navigation.navigate('Home')
          }
        }}
        variant="solid"
        color="secondary_inverted"
        size="small"
        label={_(msg`Go back`)}
        accessibilityHint={_(msg`Returns to previous page`)}>
        <ButtonIcon icon={ArrowLeftIcon} />
        <ButtonText>
          <Trans>Go back</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

/*
 * If the video is taller than 9:16
 */
function isTallAspectRatio(aspectRatio: AppBskyEmbedVideo.View['aspectRatio']) {
  const videoAspectRatio =
    (aspectRatio?.width ?? 1) / (aspectRatio?.height ?? 1)
  return videoAspectRatio <= 9 / 16
}
