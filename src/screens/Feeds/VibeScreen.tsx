import {useCallback, useEffect, useMemo, useState} from 'react'
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

      return (
        <VibeItem
          player={player}
          post={post}
          embed={post.embed}
          loaded={isFocused && Math.abs(index - currentIndex) < 2}
          active={isFocused && index === currentIndex}
        />
      )
    },
    [player1, player2, player3, currentIndex, isFocused],
  )

  const onViewableItemsChanged = useCallback(
    ({viewableItems}: {viewableItems: ViewToken[]; changed: ViewToken[]}) => {
      if (viewableItems[0] && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index)
      }
    },
    [],
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
      viewabilityConfig={{itemVisiblePercentThreshold: 75}}
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
  active,
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
  const source = embed.playlist
  const sourceChangeEvent = useEvent(player, 'sourceChange') as {
    // incorrect types
    source: {uri?: string}
    oldSource: {uri?: string}
  }

  // for initial video - useEffect will handle the typical case where
  // videos have a chance to preload
  const maybePlay = useNonReactiveCallback(() => {
    if (active && !player.playing) {
      player.play()
    }
  })

  useEffect(() => {
    if (loaded && sourceChangeEvent?.source?.uri !== source) {
      player.replace(source)
      // play next tick
      const timeout = setTimeout(() => {
        maybePlay()
      }, 0)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [sourceChangeEvent?.source?.uri, loaded, source, player, maybePlay])

  useEffect(() => {
    if (active) {
      player.play()
    } else {
      // should be a cleanup function, but that causes a crash
      player.pause()
    }
  }, [active, player])

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
        LayoutAnimation.configureNext({
          duration: 500,
          update: {type: 'spring', springDamping: 0.6},
        })
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
