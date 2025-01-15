import {useCallback, useMemo, useState} from 'react'
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
import {LinearGradient} from 'expo-linear-gradient'
import {useVideoPlayer, VideoPlayer, VideoView} from 'expo-video'
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
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {HITSLOP_20, VIBES_FEED_URI} from '#/lib/constants'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {POST_TOMBSTONE, usePostShadow} from '#/state/cache/post-shadow'
import {FeedPostSliceItem, usePostFeedQuery} from '#/state/queries/post-feed'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSetLightStatusBar} from '#/state/shell/light-status-bar'
import {List} from '#/view/com/util/List'
import {PostCtrls} from '#/view/com/util/post-ctrls/PostCtrls'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TempVibe'>
export function VibeScreen({}: Props) {
  const {top} = useSafeAreaInsets()

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
            a.z_10,
            {top: 0, left: 0, right: 0, paddingTop: top},
          ]}>
          <Layout.Header.Outer noBottomBorder>
            <Layout.Header.BackButton />
            <Layout.Header.Content>
              <Layout.Header.TitleText>
                {/* TODO: needs to be feed name */}
                <Trans>Vibes (wip)</Trans>
              </Layout.Header.TitleText>
            </Layout.Header.Content>
            <Layout.Header.Slot />
          </Layout.Header.Outer>
        </View>
        <YoloFeed />
      </Layout.Screen>
    </ThemeProvider>
  )
}

function YoloFeed() {
  const isFocused = useIsFocused()
  const {
    data,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(`feedgen|${VIBES_FEED_URI}`)

  const [currentSources, setCurrentSources] = useState<
    [string | null, string | null, string | null]
  >([null, null, null])

  const player1 = useVideoPlayer('', p => {
    p.loop = true
  })
  const player2 = useVideoPlayer('', p => {
    p.loop = true
  })
  const player3 = useVideoPlayer('', p => {
    p.loop = true
  })

  const videos = data?.pages.flatMap(page =>
    page.slices.flatMap(slice => slice.items),
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  const renderItem: ListRenderItem<FeedPostSliceItem> = useCallback(
    ({item, index}) => {
      const {post} = item
      if (!post.embed || !AppBskyEmbedVideo.isView(post.embed)) {
        return null
      }

      const player = [player1, player2, player3][index % 3]
      const currentSource = currentSources[index % 3]

      return (
        <VibeItem
          player={player}
          post={post}
          embed={post.embed}
          loaded={
            isFocused &&
            Math.abs(index - currentIndex) < 2 &&
            currentSource === post.embed.playlist
          }
          active={isFocused && index === currentIndex}
        />
      )
    },
    [player1, player2, player3, currentIndex, isFocused, currentSources],
  )

  const updateVideoState = useNonReactiveCallback((index: number) => {
    if (!videos) return
    setCurrentIndex(index)
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

      const prevPlayer = [player1, player2, player3][(index + 2) % 3]
      const prevPlayerCurrentSource = currentSources[(index + 2) % 3]
      const currPlayer = [player1, player2, player3][index % 3]
      const currPlayerCurrentSource = currentSources[index % 3]
      const nextPlayer = [player1, player2, player3][(index + 1) % 3]
      const nextPlayerCurrentSource = currentSources[(index + 1) % 3]

      if (prevVideo && prevVideo !== prevPlayerCurrentSource) {
        prevPlayer.replace(prevVideo)
        currentSources[index + (2 % 3)] = prevVideo
      }
      prevPlayer.pause()

      if (currVideo) {
        if (currVideo !== currPlayerCurrentSource) {
          currPlayer.replace(currVideo)
          currentSources[index % 3] = currVideo
        }
        currPlayer.play()
      }

      if (nextVideo && nextVideo !== nextPlayerCurrentSource) {
        nextPlayer.replace(nextVideo)
        currentSources[(index + 1) % 3] = nextVideo
      }
      nextPlayer.pause()

      return currentSources
    })
  })

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

function VibeItem({
  player,
  post,
  embed,
  loaded,
}: {
  player: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
  loaded: boolean
}) {
  const {height, width} = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const screenAspectRatio =
    (width - insets.left - insets.right) / (height - insets.bottom)

  const videoAspectRatio =
    (embed.aspectRatio?.width ?? 1) / (embed.aspectRatio?.height ?? 1)

  // if the video is either taller, on only 20% shorter than the screen,
  // set the video to be cover rather than contain
  const isCloseEnough = videoAspectRatio < screenAspectRatio * 1.2

  return (
    <View
      style={{
        height,
        width,
      }}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[a.flex_1]}>
        {loaded && (
          <VideoView
            style={[a.flex_1]}
            player={player}
            nativeControls={false}
            contentFit={isCloseEnough ? 'cover' : 'contain'}
          />
        )}
        <VibeOverlay player={player} post={post} />
      </SafeAreaView>
    </View>
  )
}

function VibeOverlay({
  player,
  post,
}: {
  player: VideoPlayer
  post: AppBskyFeedDefs.PostView
}) {
  const postShadow = usePostShadow(post)
  const insets = useSafeAreaInsets()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [expanded, setExpanded] = useState(false)

  const pushToProfile = useNonReactiveCallback(() => {
    navigation.navigate('Profile', {name: post.author.did})
  })

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause()
    } else {
      player.play()
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
    <GestureDetector gesture={gesture}>
      <View style={[a.absolute, a.inset_0, {bottom: insets.bottom}]}>
        <Button
          label="Toggle play/pause"
          onPress={togglePlayPause}
          style={[a.flex_1]}>
          <View />
        </Button>
        <LinearGradient
          colors={
            expanded
              ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']
              : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']
          }
          style={[a.w_full, a.px_xl, a.py_sm, a.gap_sm]}>
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
              expanded={expanded}
              setExpanded={setExpanded}
              value={richText}
              authorHandle={post.author.handle}
            />
          )}
          {postShadow !== POST_TOMBSTONE && record && (
            <PostCtrls
              richText={richText}
              post={postShadow}
              record={record}
              logContext="FeedItem"
              onPressReply={() =>
                navigation.navigate('PostThread', {name: post.author.did, rkey})
              }
              big
            />
          )}
        </LinearGradient>
      </View>
    </GestureDetector>
  )
}

function ExpandableRichTextView({
  value,
  authorHandle,
  expanded,
  setExpanded,
}: {
  value: RichTextAPI
  authorHandle?: string
  expanded: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const {height: screenHeight} = useWindowDimensions()
  const [constrained, setConstrained] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const {_} = useLingui()

  return (
    <ScrollView
      scrollEnabled={expanded}
      onContentSizeChange={(_w, h) => {
        if (contentHeight !== 0) {
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
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
            setExpanded(prev => !prev)
          }}>
          <ButtonText>
            {expanded ? <Trans>Read less</Trans> : <Trans>Read more</Trans>}
          </ButtonText>
        </Button>
      )}
    </ScrollView>
  )
}
