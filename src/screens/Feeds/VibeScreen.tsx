import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  ListRenderItem,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context'
import {useEvent} from 'expo'
import {BlurView} from 'expo-blur'
import {LinearGradient} from 'expo-linear-gradient'
import {useVideoPlayer, VideoPlayer, VideoView} from 'expo-video'
import {
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {VIBES_FEED_URI} from '#/lib/constants'
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
import {Button} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TempVibe'>
export function VibeScreen({}: Props) {
  const {top} = useSafeAreaInsets()
  const [headerHeight, setHeaderHeight] = useState(0)

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
        <BlurView
          intensity={25}
          tint="systemThinMaterialDark"
          style={[
            a.absolute,
            a.z_10,
            {top: 0, left: 0, right: 0, paddingTop: top},
          ]}
          onLayout={({nativeEvent}) =>
            setHeaderHeight(nativeEvent.layout.height)
          }>
          <Layout.Header.Outer>
            <Layout.Header.BackButton />
            <Layout.Header.Content>
              <Layout.Header.TitleText>
                {/* TODO: needs to be feed name */}
                <Trans>Vibes (wip)</Trans>
              </Layout.Header.TitleText>
            </Layout.Header.Content>
            <Layout.Header.Slot />
          </Layout.Header.Outer>
        </BlurView>
        <YoloFeed headerHeight={headerHeight} />
      </Layout.Screen>
    </ThemeProvider>
  )
}

function YoloFeed({headerHeight}: {headerHeight: number}) {
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
          headerHeight={headerHeight}
        />
      )
    },
    [player1, player2, player3, currentIndex, headerHeight, isFocused],
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
  headerHeight,
}: {
  player: VideoPlayer
  post: AppBskyFeedDefs.PostView
  embed: AppBskyEmbedVideo.View
  active: boolean
  loaded: boolean
  headerHeight: number
}) {
  const {height, width} = useWindowDimensions()
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
      console.log('play (nonreactive)')
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
      console.log('play (effect)')
      player.play()
    } else {
      // should be a cleanup function, but that causes a crash
      player.pause()
    }
  }, [active, player])

  return (
    <View
      style={{
        height,
        width,
      }}>
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={[a.flex_1, {paddingTop: headerHeight}]}>
        {active && (
          <VideoView
            style={[a.flex_1]}
            player={player}
            nativeControls={false}
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
      .failOffsetY([-10, 10])
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
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
          style={[a.w_full, a.px_xl, a.py_sm, a.gap_sm]}>
          <View style={[a.flex_row, a.gap_md, a.align_center]}>
            <PreviewableUserAvatar profile={post.author} size={32} />
            <View>
              <Text style={[a.text_md, a.font_heavy]} numberOfLines={1}>
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
          <RichText
            value={richText}
            style={[a.text_sm]}
            authorHandle={post.author.handle}
            enableTags
          />
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
