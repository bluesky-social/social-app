import {useCallback, useEffect, useState} from 'react'
import {
  ListRenderItem,
  SafeAreaView,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useEvent} from 'expo'
import {BlurView} from 'expo-blur'
import {useVideoPlayer, VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo, AppBskyFeedDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {THEVIDS_FEED_URI} from '#/lib/constants'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {FeedPostSliceItem, usePostFeedQuery} from '#/state/queries/post-feed'
import {useSetMinimalShellMode} from '#/state/shell'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>
export function YoloScreen({}: Props) {
  const {top} = useSafeAreaInsets()
  const t = useTheme()
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

  return (
    <Layout.Screen noInsetTop style={{backgroundColor: 'black'}}>
      <BlurView
        intensity={100}
        tint={
          t.scheme === 'dark' ? 'systemMaterialDark' : 'systemMaterialLight'
        }
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
              <Trans>Yolo mode</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
      </BlurView>
      <YoloFeed headerHeight={headerHeight} />
    </Layout.Screen>
  )
}

function YoloFeed({headerHeight}: {headerHeight: number}) {
  const {
    data,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostFeedQuery(`feedgen|${THEVIDS_FEED_URI}`)

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
        <VideoScreen
          player={player}
          post={post}
          embed={post.embed}
          loaded={Math.abs(index - currentIndex) < 2}
          active={index === currentIndex}
          headerHeight={headerHeight}
        />
      )
    },
    [player1, player2, player3, currentIndex, headerHeight],
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

function VideoScreen({
  player,
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

  useEffect(() => {
    if (loaded && sourceChangeEvent?.source?.uri !== source) {
      player.replace(source)
    }
  }, [sourceChangeEvent?.source?.uri, loaded, source, player])

  useEffect(() => {
    if (active) {
      player.play()
    }
    return () => {
      player.pause()
    }
  }, [active, player])

  return (
    <View
      style={{
        height,
        width,
      }}>
      <SafeAreaView style={[a.flex_1, {paddingTop: headerHeight}]}>
        {active && (
          <VideoView
            style={[a.flex_1]}
            player={player}
            nativeControls={false}
          />
        )}
      </SafeAreaView>
    </View>
  )
}
