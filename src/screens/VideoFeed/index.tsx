import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  LayoutAnimation,
  ListRenderItem,
  Pressable,
  ScrollView,
  View,
  ViewToken,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeGesture,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import {useEvent, useEventListener} from 'expo'
import {Image, ImageStyle} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {createVideoPlayer, VideoPlayer, VideoView} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
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
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
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
import {formatTime} from '#/view/com/util/post-embeds/VideoEmbedInner/web-controls/utils'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Header} from '#/screens/VideoFeed/components/Header'
import {atoms as a, platform, ThemeProvider, tokens, useTheme} from '#/alf'
import {setNavigationBar} from '#/alf/util/navigationBar'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

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

function Feed() {
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'VideoFeed'>>()
  const isFocused = useIsFocused()
  const {hasSession} = useSession()
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
  const {
    data,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(feedDesc)
  const videos = React.useMemo(() => {
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
    [string | null, string | null, string | null]
  >([null, null, null])

  const [players, setPlayers] = useState<
    [VideoPlayer, VideoPlayer, VideoPlayer] | null
  >(createThreeVideoPlayers)

  const [currentIndex, setCurrentIndex] = useState(0)

  const scrollGesture = useMemo(() => Gesture.Native(), [])

  const renderItem: ListRenderItem<FeedPostSliceItem> = useCallback(
    ({item, index}) => {
      const {post} = item
      if (!post.embed || !AppBskyEmbedVideo.isView(post.embed)) {
        return null
      }

      const player = players?.[index % 3]
      const currentSource = currentSources[index % 3]

      return (
        <VideoItem
          player={player}
          post={post}
          embed={post.embed}
          active={
            isFocused &&
            index === currentIndex &&
            currentSource === post.embed.playlist
          }
          scrollGesture={scrollGesture}
        />
      )
    },
    [players, currentIndex, isFocused, currentSources, scrollGesture],
  )

  const updateVideoState = useNonReactiveCallback((index?: number) => {
    if (!videos) return

    if (index === undefined) {
      index = currentIndex
    } else {
      setCurrentIndex(index)
    }

    setCurrentSources(oldSources => {
      const currentSources = [...oldSources] as [
        string | null,
        string | null,
        string | null,
      ]

      const prevEmbed = videos[index - 1]?.post.embed
      const prevVideo =
        prevEmbed && AppBskyEmbedVideo.isView(prevEmbed)
          ? prevEmbed.playlist
          : null
      const currEmbed = videos[index]?.post.embed
      const currVideo =
        currEmbed && AppBskyEmbedVideo.isView(currEmbed)
          ? currEmbed.playlist
          : null
      const nextEmbed = videos[index + 1]?.post.embed
      const nextVideo =
        nextEmbed && AppBskyEmbedVideo.isView(nextEmbed)
          ? nextEmbed.playlist
          : null

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

        if (prevVideo && prevVideo !== prevPlayerCurrentSource) {
          prevPlayer.replace(prevVideo)
        }
        prevPlayer.pause()

        if (currVideo) {
          if (currVideo !== currPlayerCurrentSource) {
            currPlayer.replace(currVideo)
          }
          currPlayer.play()
        }

        if (nextVideo && nextVideo !== nextPlayerCurrentSource) {
          nextPlayer.replace(nextVideo)
        }
        nextPlayer.pause()
      }

      if (prevVideo && prevVideo !== prevPlayerCurrentSource) {
        currentSources[(index + 2) % 3] = prevVideo
      }

      if (currVideo && currVideo !== currPlayerCurrentSource) {
        currentSources[index % 3] = currVideo
      }

      if (nextVideo && nextVideo !== nextPlayerCurrentSource) {
        currentSources[(index + 1) % 3] = nextVideo
      }

      // use old array if no changes
      if (
        oldSources[0] === currentSources[0] &&
        oldSources[1] === currentSources[1] &&
        oldSources[2] === currentSources[2]
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

  return (
    <FeedFeedbackProvider value={feedFeedback}>
      <GestureDetector gesture={scrollGesture}>
        <List
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled={true}
          refreshing={isFetching}
          onRefresh={refetch}
          ListFooterComponent={
            <ListFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onRetry={refetch}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{itemVisiblePercentThreshold: 100}}
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
}: {
  player?: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
  scrollGesture: NativeGesture
}) {
  const postShadow = usePostShadow(post)
  const {width, height} = useSafeAreaFrame()
  const {onItemSeen} = useFeedFeedbackContext()

  React.useEffect(() => {
    let to: NodeJS.Timeout | null = null
    if (active) {
      to = setTimeout(() => {
        onItemSeen(post)
      }, 1000)
    } else if (to) {
      clearTimeout(to)
    }
  }, [active, post, onItemSeen])

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
            <Overlay
              player={player}
              post={postShadow}
              active={active}
              scrollGesture={scrollGesture}
            />
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

function Overlay({
  player,
  post,
  active,
  scrollGesture,
}: {
  player?: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
  active: boolean
  scrollGesture: NativeGesture
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

  return (
    <>
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
                <UserAvatar type="user" avatar={post.author.avatar} size={32} />
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
                  hoverStyle={[]}
                  onPress={() =>
                    profile.viewer?.following ? queueUnfollow() : queueFollow()
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
    </>
  )
}

/**
 * Magic number that matches the Scrubber height
 */
function ScrubberPlaceholder() {
  const {bottom} = useSafeAreaInsets()
  return (
    <View
      style={[
        a.w_full,
        {
          // same as Scrubber
          height: bottom + tokens.space.xl,
        },
      ]}
    />
  )
}

function Scrubber({
  player,
  seekingAnimationSV,
  scrollGesture,
}: {
  player: VideoPlayer
  seekingAnimationSV: SharedValue<number>
  scrollGesture: NativeGesture
}) {
  const {width: screenWidth} = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const currentTimeSV = useSharedValue(0)
  const durationSV = useSharedValue(0)
  const [currentSeekTime, setCurrentSeekTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const updateTime = (currentTime: number, duration: number) => {
    'worklet'
    currentTimeSV.set(currentTime)
    durationSV.set(duration)
  }

  useEventListener(player, 'timeUpdate', evt => {
    runOnUI(updateTime)(evt.currentTime, player.duration)
  })

  const isSeekingSV = useSharedValue(false)
  const seekProgressSV = useSharedValue(0)

  useAnimatedReaction(
    () => Math.round(seekProgressSV.get()),
    (progress, prevProgress) => {
      if (progress !== prevProgress) {
        runOnJS(setCurrentSeekTime)(progress)
      }
    },
  )

  useAnimatedReaction(
    () => Math.round(durationSV.get()),
    (duration, prevDuration) => {
      if (duration !== prevDuration) {
        runOnJS(setDuration)(duration)
      }
    },
  )

  const seekBy = useCallback(
    (time: number) => {
      player.seekBy(time)
    },
    [player],
  )

  const scrubPanGesture = useMemo(() => {
    return Gesture.Pan()
      .blocksExternalGesture(scrollGesture)
      .activeOffsetX([-1, 1])
      .failOffsetY([-10, 10])
      .onBegin(() => {
        'worklet'
      })
      .onStart(() => {
        'worklet'
        seekProgressSV.set(currentTimeSV.get())
        isSeekingSV.set(true)
        seekingAnimationSV.set(withTiming(1, {duration: 500}))
      })
      .onUpdate(evt => {
        'worklet'
        const progress = evt.x / screenWidth
        seekProgressSV.set(
          clamp(progress * durationSV.get(), 0, durationSV.get()),
        )
      })
      .onEnd(evt => {
        'worklet'
        isSeekingSV.get()

        const progress = evt.x / screenWidth
        const newTime = clamp(progress * durationSV.get(), 0, durationSV.get())

        // it's seek by, so offset by the current time
        runOnJS(seekBy)(newTime - currentTimeSV.get())

        isSeekingSV.set(false)
        seekingAnimationSV.set(withTiming(0, {duration: 500}))
      })
  }, [
    scrollGesture,
    seekingAnimationSV,
    seekBy,
    screenWidth,
    currentTimeSV,
    durationSV,
    isSeekingSV,
    seekProgressSV,
  ])

  const timeStyle = useAnimatedStyle(() => {
    return {
      display: seekingAnimationSV.get() === 0 ? 'none' : 'flex',
      opacity: seekingAnimationSV.get(),
    }
  })

  const barStyle = useAnimatedStyle(() => {
    const currentTime = isSeekingSV.get()
      ? seekProgressSV.get()
      : currentTimeSV.get()
    const progress = currentTime === 0 ? 0 : currentTime / durationSV.get()
    return {
      height: seekingAnimationSV.get() * 3 + 1,
      width: `${progress * 100}%`,
    }
  })

  return (
    <>
      <Animated.View
        style={[
          a.absolute,
          {
            left: 0,
            right: 0,
            bottom: insets.bottom + 48,
          },
          timeStyle,
        ]}
        pointerEvents="none">
        <Text style={[a.text_center, a.font_bold]}>
          <Text style={[a.text_5xl, {fontVariant: ['tabular-nums']}]}>
            {formatTime(currentSeekTime)}
          </Text>
          <Text style={[a.text_2xl, {opacity: 0.8}]}>{'  /  '}</Text>
          <Text
            style={[
              a.text_5xl,
              {opacity: 0.8},
              {fontVariant: ['tabular-nums']},
            ]}>
            {formatTime(duration)}
          </Text>
        </Text>
      </Animated.View>

      <GestureDetector gesture={scrubPanGesture}>
        <View
          style={[
            a.relative,
            a.w_full,
            a.justify_end,
            {
              paddingBottom: insets.bottom,
              height:
                // bottom padding
                insets.bottom +
                // actual height
                tokens.space.xl,
            },
            a.z_10,
          ]}>
          <Animated.View style={[{backgroundColor: 'white'}, barStyle]} />
        </View>
      </GestureDetector>
    </>
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
}: {
  embed: AppBskyEmbedVideo.View
  style?: ImageStyle
}) {
  const src = embed.thumbnail
  return src ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{uri: src}}
      style={[a.absolute, a.inset_0, style]}
      contentFit={isTallAspectRatio(embed.aspectRatio) ? 'cover' : 'contain'}
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

function clamp(num: number, min: number, max: number) {
  'worklet'
  return Math.min(Math.max(num, min), max)
}

/*
 * If the video is taller than 9:16
 */
function isTallAspectRatio(aspectRatio: AppBskyEmbedVideo.View['aspectRatio']) {
  const videoAspectRatio =
    (aspectRatio?.width ?? 1) / (aspectRatio?.height ?? 1)
  return videoAspectRatio <= 9 / 16
}
