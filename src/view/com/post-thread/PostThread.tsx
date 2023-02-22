import React, {useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from 'state/models/post-thread-view'
import {PostThreadItem} from './PostThreadItem'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {s} from 'lib/styles'

export const PostThread = observer(function PostThread({
  uri,
  view,
}: {
  uri: string
  view: PostThreadViewModel
}) {
  const ref = useRef<FlatList>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const posts = React.useMemo(
    () => (view.thread ? Array.from(flattenThread(view.thread)) : []),
    [view.thread],
  )

  // events
  // =
  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      view?.refresh()
    } catch (err) {
      view.rootStore.log.error('Failed to refresh posts thread', err)
    }
    setIsRefreshing(false)
  }, [view, setIsRefreshing])
  const onLayout = React.useCallback(() => {
    const index = posts.findIndex(post => post._isHighlightedPost)
    if (index !== -1) {
      ref.current?.scrollToIndex({
        index,
        animated: false,
        viewOffset: 40,
      })
    }
  }, [posts, ref])
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

  // loading
  // =
  if ((view.isLoading && !view.isRefreshing) || view.params.uri !== uri) {
    return (
      <CenteredView>
        <ActivityIndicator />
      </CenteredView>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <CenteredView>
        <ErrorMessage message={view.error} onPressTryAgain={onRefresh} />
      </CenteredView>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: PostThreadViewPostModel}) => (
    <PostThreadItem item={item} onPostReply={onRefresh} />
  )
  return (
    <FlatList
      ref={ref}
      data={posts}
      initialNumToRender={posts.length}
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      onLayout={onLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
      style={s.h100pct}
      contentContainerStyle={s.contentContainer}
    />
  )
})

function* flattenThread(
  post: PostThreadViewPostModel,
  isAscending = false,
): Generator<PostThreadViewPostModel, void> {
  if (post.parent) {
    if ('notFound' in post.parent && post.parent.notFound) {
      // TODO render not found
    } else {
      yield* flattenThread(post.parent as PostThreadViewPostModel, true)
    }
  }
  yield post
  if (post.replies?.length) {
    for (const reply of post.replies) {
      if ('notFound' in reply && reply.notFound) {
        // TODO render not found
      } else {
        yield* flattenThread(reply as PostThreadViewPostModel)
      }
    }
  } else if (!isAscending && !post.parent && post.post.replyCount > 0) {
    post._hasMore = true
  }
}
