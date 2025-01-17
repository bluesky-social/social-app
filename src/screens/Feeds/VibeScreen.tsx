import {useCallback, useMemo, useRef, useState} from 'react'
import {
  LayoutAnimation,
  ListRenderItem,
  ScrollView,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import {useEvent} from 'expo'
import {Image} from 'expo-image'
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
import {usePostLikeMutationQueue} from '#/state/queries/post'
import {FeedPostSliceItem, usePostFeedQuery} from '#/state/queries/post-feed'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSetLightStatusBar} from '#/state/shell/light-status-bar'
import {List} from '#/view/com/util/List'
import {PostCtrls} from '#/view/com/util/post-ctrls/PostCtrls'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {Header} from '#/screens/VideoFeed/Header'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

function createThreeVideoPlayers(
  sources?: [string, string, string],
): [VideoPlayer, VideoPlayer, VideoPlayer] {
  const p1 = createVideoPlayer(sources?.[0] ?? '')
  p1.loop = true
  const p2 = createVideoPlayer(sources?.[1] ?? '')
  p2.loop = true
  const p3 = createVideoPlayer(sources?.[2] ?? '')
  p3.loop = true
  return [p1, p2, p3]
}

export function VideoFeed({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'VideoFeed'
>) {
  const {top} = useSafeAreaInsets()
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'VideoFeed'>>()

  const setMinShellMode = useSetMinimalShellMode()
  useFocusEffect(
    useCallback(() => {
      setMinShellMode(true)
      return () => {
        setMinShellMode(false)
      }
    }, [setMinShellMode]),
  )

  useSetLightStatusBar(true)

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
        <Inner />
      </Layout.Screen>
    </ThemeProvider>
  )
}

function Inner() {
  const {params} = useRoute<RouteProp<CommonNavigatorParams, 'VideoFeed'>>()
  const isFocused = useIsFocused()
  const feedDesc = useMemo(() => {
    switch (params.type) {
      case 'feedgen':
        return `feedgen|${params.uri}` as const
      case 'author':
        return `author|${params.did}|${params.filter}` as const
      default:
        throw new Error(`Invalid video feed params ${JSON.stringify(params)}`)
    }
  }, [params])
  const {
    data,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(feedDesc)

  let videos = data?.pages.flatMap(page =>
    page.slices.flatMap(slice => slice.items),
  )
  const startingVideoIndex = videos?.findIndex(video => {
    return video.post.uri === params.initialPostUri
  })
  if (videos && startingVideoIndex && startingVideoIndex > -1) {
    videos = videos.slice(startingVideoIndex)
  }

  const [currentSources, setCurrentSources] = useState<
    [string | null, string | null, string | null]
  >([null, null, null])

  const [players, setPlayers] = useState<
    [VideoPlayer, VideoPlayer, VideoPlayer] | null
  >(createThreeVideoPlayers)

  const [currentIndex, setCurrentIndex] = useState(0)

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
        />
      )
    },
    [players, currentIndex, isFocused, currentSources],
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
      viewabilityConfig={{itemVisiblePercentThreshold: 95}}
    />
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
}: {
  player?: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
}) {
  const postShadow = usePostShadow(post)
  const {height, width} = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        height,
        width,
      }}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[a.flex_1]}>
        {player ? (
          <VideoItemInner player={player} embed={embed} active={active} />
        ) : (
          embed.thumbnail && (
            <Image
              accessibilityIgnoresInvertColors
              source={{uri: embed.thumbnail}}
              style={[
                a.flex_1,
                a.absolute,
                {
                  top: 0,
                  left: insets.left,
                  right: insets.right,
                  bottom: insets.bottom,
                },
              ]}
              contentFit="contain"
            />
          )
        )}
        {postShadow !== POST_TOMBSTONE ? (
          player && <Overlay player={player} post={postShadow} />
        ) : (
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
  const insets = useSafeAreaInsets()
  const {status} = useEvent(player, 'statusChange', {status: player.status})

  const videoAspectRatio =
    (embed.aspectRatio?.width ?? 1) / (embed.aspectRatio?.height ?? 1)

  // if the video tall enough (tiktok/reels are 9:16) go cover mode
  const isCloseEnough = videoAspectRatio <= 9 / 16

  return (
    <>
      {active && player && (
        <VideoView
          style={[a.flex_1]}
          player={player}
          nativeControls={false}
          contentFit={isCloseEnough ? 'cover' : 'contain'}
          accessibilityIgnoresInvertColors
        />
      )}
      {embed.thumbnail && (
        <Image
          accessibilityIgnoresInvertColors
          source={{uri: embed.thumbnail}}
          style={[
            a.flex_1,
            a.absolute,
            {
              zIndex: status === 'loading' && isAndroid ? 1 : -1,
              top: 0,
              left: insets.left,
              right: insets.right,
              bottom: insets.bottom,
            },
          ]}
          contentFit={isCloseEnough ? 'cover' : 'contain'}
        />
      )}
    </>
  )
}

function Overlay({
  player,
  post,
}: {
  player: VideoPlayer
  post: Shadow<AppBskyFeedDefs.PostView>
}) {
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {status} = useEvent(player, 'statusChange', {status: player.status})
  const doubleTapRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [queueLike] = usePostLikeMutationQueue(post, 'ImmersiveVideo')

  const pushToProfile = useNonReactiveCallback(() => {
    navigation.navigate('Profile', {name: post.author.did})
  })

  const togglePlayPause = () => {
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
    } else {
      doubleTapRef.current = setTimeout(togglePlayPause, 200)
    }
  }

  const gesture = useMemo(() => {
    const dragLeftGesture = Gesture.Pan()
      .activeOffsetX([0, 10])
      .failOffsetX([-10, 0])
      .failOffsetY([-5, 5])
      .maxPointers(1)
      .onEnd(evt => {
        'worklet'
        if (evt.translationX < -50) {
          runOnJS(pushToProfile)()
        }
      })

    return dragLeftGesture
  }, [pushToProfile])

  const rkey = new AtUri(post.uri).rkey
  const record = AppBskyFeedPost.isRecord(post.record) ? post.record : undefined
  const richText = new RichTextAPI({
    text: record?.text || '',
    facets: record?.facets,
  })

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={[a.absolute, a.inset_0, a.z_20, {bottom: insets.bottom}]}>
          <Button
            label="Toggle play/pause"
            accessibilityHint="Double tap to like"
            onPress={onPress}
            style={[a.flex_1]}>
            <View />
          </Button>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={[a.w_full, a.px_xl, a.py_sm, a.gap_md]}>
            <View style={[a.flex_row, a.gap_md, a.align_center]}>
              <PreviewableUserAvatar profile={post.author} size={32} />
              <View>
                <Text style={[a.text_md, a.font_heavy]} emoji numberOfLines={1}>
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
            </View>
            {record?.text?.trim() && (
              <ExpandableRichTextView
                value={richText}
                authorHandle={post.author.handle}
              />
            )}
            {record && (
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
            )}
          </LinearGradient>
        </View>
      </GestureDetector>
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
  const {height: screenHeight} = useWindowDimensions()
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
        a.gap_xs,
        expanded ? [a.align_start] : a.flex_row,
      ]}>
      <RichText
        value={value}
        style={[a.text_sm, a.flex_1]}
        authorHandle={authorHandle}
        enableTags
        numberOfLines={expanded ? undefined : constrained ? 1 : 2}
        onTextLayout={evt => {
          if (!constrained && evt.nativeEvent.lines.length > 1) {
            setConstrained(true)
          }
        }}
      />
      {constrained && (
        <Button
          label={expanded ? _(msg`Read less`) : _(msg`Read more`)}
          hitSlop={HITSLOP_20}
          onPress={() => setExpanded(prev => !prev)}>
          <ButtonText>
            {expanded ? <Trans>Read less</Trans> : <Trans>Read more</Trans>}
          </ButtonText>
        </Button>
      )}
    </ScrollView>
  )
}
