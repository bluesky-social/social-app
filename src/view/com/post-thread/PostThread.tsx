import React, {useRef} from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AppBskyFeedDefs, AppBskyFeedPost} from '@atproto/api'
import {CenteredView, FlatList} from '../util/Views'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {PostThreadItem} from './PostThreadItem'
import {ComposePrompt} from '../composer/Prompt'
import {ViewHeader} from '../util/ViewHeader'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {useQueryClient} from '@tanstack/react-query'
import {
  PostThreadSkeletonNode,
  PostThreadSkeletonPost,
  usePostThreadQuery,
  sortThreadSkeleton,
} from '#/state/queries/post-thread'
import {useNavigation} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {usePostQuery} from '#/state/queries/post'
import {cleanError} from '#/lib/strings/errors'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {useStores} from '#/state'

// const MAINTAIN_VISIBLE_CONTENT_POSITION = {minIndexForVisible: 2} TODO

const TOP_COMPONENT = {_reactKey: '__top_component__'}
const PARENT_SPINNER = {_reactKey: '__parent_spinner__'}
const REPLY_PROMPT = {_reactKey: '__reply__'}
const DELETED = {_reactKey: '__deleted__'}
const BLOCKED = {_reactKey: '__blocked__'}
const CHILD_SPINNER = {_reactKey: '__child_spinner__'}
const LOAD_MORE = {_reactKey: '__load_more__'}
const BOTTOM_COMPONENT = {_reactKey: '__bottom_component__'}

type YieldedItem =
  | PostThreadSkeletonPost
  | typeof TOP_COMPONENT
  | typeof PARENT_SPINNER
  | typeof REPLY_PROMPT
  | typeof DELETED
  | typeof BLOCKED
  | typeof PARENT_SPINNER

export function PostThread({
  uri,
  onPressReply,
  treeView,
}: {
  uri: string
  onPressReply: () => void
  treeView: boolean
}) {
  const {data: resolvedUri} = useResolveUriQuery(uri)
  const {
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    data: threadSkeleton,
  } = usePostThreadQuery(resolvedUri)
  const {data: rootPost} = usePostQuery(threadSkeleton?.uri)
  const rootPostRecord =
    rootPost && AppBskyFeedPost.isRecord(rootPost.record)
      ? rootPost.record
      : undefined

  useSetTitle(
    rootPost &&
      `${sanitizeDisplayName(
        rootPost.author.displayName || `@${rootPost.author.handle}`,
      )}: "${rootPostRecord?.text}"`,
  )

  if (isError || AppBskyFeedDefs.isNotFoundPost(threadSkeleton)) {
    return (
      <PostThreadError
        error={error}
        notFound={AppBskyFeedDefs.isNotFoundPost(threadSkeleton)}
        onRefresh={refetch}
      />
    )
  }
  if (AppBskyFeedDefs.isBlockedPost(threadSkeleton)) {
    return <PostThreadBlocked />
  }
  if (!threadSkeleton || isLoading) {
    return (
      <CenteredView>
        <View style={s.p20}>
          <ActivityIndicator size="large" />
        </View>
      </CenteredView>
    )
  }
  return (
    <PostThreadLoaded
      threadSkeleton={threadSkeleton}
      isRefetching={isRefetching}
      treeView={treeView}
      onRefresh={refetch}
      onPressReply={onPressReply}
    />
  )
}

function PostThreadLoaded({
  threadSkeleton,
  isRefetching,
  treeView,
  onRefresh,
  onPressReply,
}: {
  threadSkeleton: PostThreadSkeletonNode
  isRefetching: boolean
  treeView: boolean
  onRefresh: () => void
  onPressReply: () => void
}) {
  const pal = usePalette('default')
  const queryClient = useQueryClient()
  const store = useStores()
  const {isTablet, isDesktop} = useWebMediaQueries()
  const ref = useRef<FlatList>(null)
  // const hasScrolledIntoView = useRef<boolean>(false) TODO
  const [maxVisible, setMaxVisible] = React.useState(100)

  // TODO
  // const posts = React.useMemo(() => {
  //   if (view.thread) {
  //     let arr = [TOP_COMPONENT].concat(Array.from(flattenThread(view.thread)))
  //     if (arr.length > maxVisible) {
  //       arr = arr.slice(0, maxVisible).concat([LOAD_MORE])
  //     }
  //     if (view.isLoadingFromCache) {
  //       if (view.thread?.postRecord?.reply) {
  //         arr.unshift(PARENT_SPINNER)
  //       }
  //       arr.push(CHILD_SPINNER)
  //     } else {
  //       arr.push(BOTTOM_COMPONENT)
  //     }
  //     return arr
  //   }
  //   return []
  // }, [view.isLoadingFromCache, view.thread, maxVisible])
  // const highlightedPostIndex = posts.findIndex(post => post._isHighlightedPost)
  const posts = React.useMemo(() => {
    let arr = [TOP_COMPONENT].concat(
      Array.from(
        flattenThreadSkeleton(
          sortThreadSkeleton(
            queryClient,
            threadSkeleton,
            store.preferences.thread,
          ),
        ),
      ),
    )
    if (arr.length > maxVisible) {
      arr = arr.slice(0, maxVisible).concat([LOAD_MORE])
    }
    arr.push(BOTTOM_COMPONENT)
    return arr
  }, [threadSkeleton, maxVisible, queryClient, store.preferences.thread])

  // TODO
  /*const onContentSizeChange = React.useCallback(() => {
    // only run once
    if (hasScrolledIntoView.current) {
      return
    }

    // wait for loading to finish
    if (
      !view.hasContent ||
      (view.isFromCache && view.isLoadingFromCache) ||
      view.isLoading
    ) {
      return
    }

    if (highlightedPostIndex !== -1) {
      ref.current?.scrollToIndex({
        index: highlightedPostIndex,
        animated: false,
        viewPosition: 0,
      })
      hasScrolledIntoView.current = true
    }
  }, [
    highlightedPostIndex,
    view.hasContent,
    view.isFromCache,
    view.isLoadingFromCache,
    view.isLoading,
  ])*/
  const onScrollToIndexFailed = React.useCallback(
    (info: {
      index: number
      highestMeasuredFrameIndex: number
      averageItemLength: number
    }) => {
      ref.current?.scrollToOffset({
        animated: false,
        offset: info.averageItemLength * info.index,
      })
    },
    [ref],
  )

  const renderItem = React.useCallback(
    ({item, index}: {item: YieldedItem; index: number}) => {
      if (item === TOP_COMPONENT) {
        return isTablet ? <ViewHeader title="Post" /> : null
      } else if (item === PARENT_SPINNER) {
        return (
          <View style={styles.parentSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (item === REPLY_PROMPT) {
        return (
          <View>
            {isDesktop && <ComposePrompt onPressCompose={onPressReply} />}
          </View>
        )
      } else if (item === DELETED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              Deleted post.
            </Text>
          </View>
        )
      } else if (item === BLOCKED) {
        return (
          <View style={[pal.border, pal.viewLight, styles.itemContainer]}>
            <Text type="lg-bold" style={pal.textLight}>
              Blocked post.
            </Text>
          </View>
        )
      } else if (item === LOAD_MORE) {
        return (
          <Pressable
            onPress={() => setMaxVisible(n => n + 50)}
            style={[pal.border, pal.view, styles.itemContainer]}
            accessibilityLabel="Load more posts"
            accessibilityHint="">
            <View
              style={[
                pal.viewLight,
                {paddingHorizontal: 18, paddingVertical: 14, borderRadius: 6},
              ]}>
              <Text type="lg-medium" style={pal.text}>
                Load more posts
              </Text>
            </View>
          </Pressable>
        )
      } else if (item === BOTTOM_COMPONENT) {
        // HACK
        // due to some complexities with how flatlist works, this is the easiest way
        // I could find to get a border positioned directly under the last item
        // -prf
        return (
          <View
            style={{
              height: 400,
              borderTopWidth: 1,
              borderColor: pal.colors.border,
            }}
          />
        )
      } else if (item === CHILD_SPINNER) {
        return (
          <View style={styles.childSpinner}>
            <ActivityIndicator />
          </View>
        )
      } else if (isSkeletonPost(item)) {
        const prev = isSkeletonPost(posts[index - 1])
          ? (posts[index - 1] as PostThreadSkeletonPost)
          : undefined
        return (
          <PostThreadItem
            uri={item.uri}
            treeView={treeView}
            depth={item.ctx.depth}
            isHighlightedPost={item.ctx.isHighlightedPost}
            hasMore={item.ctx.hasMore}
            showChildReplyLine={item.ctx.showChildReplyLine}
            showParentReplyLine={item.ctx.showParentReplyLine}
            hasPrecedingItem={!!prev?.ctx.showChildReplyLine}
            onPostReply={onRefresh}
          />
        )
      }
      return <></>
    },
    [
      isTablet,
      isDesktop,
      onPressReply,
      pal.border,
      pal.viewLight,
      pal.textLight,
      pal.view,
      pal.text,
      pal.colors.border,
      posts,
      onRefresh,
      treeView,
    ],
  )

  return (
    <FlatList
      ref={ref}
      data={posts}
      initialNumToRender={posts.length}
      maintainVisibleContentPosition={
        undefined // TODO
        // isNative && view.isFromCache && view.isCachedPostAReply
        //   ? MAINTAIN_VISIBLE_CONTENT_POSITION
        //   : undefined
      }
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onContentSizeChange={
        undefined //TODOisNative && view.isFromCache ? undefined : onContentSizeChange
      }
      onScrollToIndexFailed={onScrollToIndexFailed}
      style={s.hContentRegion}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
}

function PostThreadBlocked() {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <CenteredView>
      <View style={[pal.view, pal.border, styles.notFoundContainer]}>
        <Text type="title-lg" style={[pal.text, s.mb5]}>
          Post hidden
        </Text>
        <Text type="md" style={[pal.text, s.mb10]}>
          You have blocked the author or you have been blocked by the author.
        </Text>
        <TouchableOpacity
          onPress={onPressBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="">
          <Text type="2xl" style={pal.link}>
            <FontAwesomeIcon
              icon="angle-left"
              style={[pal.link as FontAwesomeIconStyle, s.mr5]}
              size={14}
            />
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </CenteredView>
  )
}

function PostThreadError({
  onRefresh,
  notFound,
  error,
}: {
  onRefresh: () => void
  notFound: boolean
  error: Error | null
}) {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  if (notFound) {
    return (
      <CenteredView>
        <View style={[pal.view, pal.border, styles.notFoundContainer]}>
          <Text type="title-lg" style={[pal.text, s.mb5]}>
            Post not found
          </Text>
          <Text type="md" style={[pal.text, s.mb10]}>
            The post may have been deleted.
          </Text>
          <TouchableOpacity
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="">
            <Text type="2xl" style={pal.link}>
              <FontAwesomeIcon
                icon="angle-left"
                style={[pal.link as FontAwesomeIconStyle, s.mr5]}
                size={14}
              />
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </CenteredView>
    )
  }
  return (
    <CenteredView>
      <ErrorMessage message={cleanError(error)} onPressTryAgain={onRefresh} />
    </CenteredView>
  )
}

function isSkeletonPost(v: unknown): v is PostThreadSkeletonPost {
  return !!v && typeof v === 'object' && 'type' in v && v.type === 'post'
}

function* flattenThreadSkeleton(
  node: PostThreadSkeletonNode,
): Generator<YieldedItem, void> {
  if (node.type === 'post') {
    if (node.parent) {
      yield* flattenThreadSkeleton(node.parent)
    }
    yield node
    if (node.ctx.isHighlightedPost) {
      yield REPLY_PROMPT
    }
    if (node.replies?.length) {
      for (const reply of node.replies) {
        yield* flattenThreadSkeleton(reply)
      }
    }
  } else if (node.type === 'not-found') {
    yield DELETED
  } else if (node.type === 'blocked') {
    yield BLOCKED
  }
}

const styles = StyleSheet.create({
  notFoundContainer: {
    margin: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 6,
  },
  itemContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  parentSpinner: {
    paddingVertical: 10,
  },
  childSpinner: {
    paddingBottom: 200,
  },
})
