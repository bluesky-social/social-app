import React, {useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, Text, View} from 'react-native'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from '../../../state/models/post-thread-view'
import {useStores} from '../../../state'
import {PostThreadItem} from './PostThreadItem'
import {ErrorMessage} from '../util/ErrorMessage'

export const PostThread = observer(function PostThread({
  uri,
  view,
}: {
  uri: string
  view: PostThreadViewModel
}) {
  const ref = useRef<FlatList>(null)
  const posts = view.thread ? Array.from(flattenThread(view.thread)) : []
  const onRefresh = () => {
    view?.refresh().catch(err => console.error('Failed to refresh', err))
  }
  const onLayout = () => {
    const index = posts.findIndex(post => post._isHighlightedPost)
    if (index !== -1) {
      ref.current?.scrollToIndex({
        index,
        animated: false,
        viewOffset: 40,
      })
    }
  }
  const onScrollToIndexFailed = (info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
    ref.current?.scrollToOffset({
      animated: false,
      offset: info.averageItemLength * info.index,
    })
  }

  // loading
  // =
  if ((view.isLoading && !view.isRefreshing) || view.params.uri !== uri) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (view.hasError) {
    return (
      <View>
        <ErrorMessage
          dark
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onRefresh}
        />
      </View>
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
      keyExtractor={item => item._reactKey}
      renderItem={renderItem}
      refreshing={view.isRefreshing}
      onRefresh={onRefresh}
      onLayout={onLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
      style={{flex: 1}}
      contentContainerStyle={{paddingBottom: 200}}
    />
  )
})

function* flattenThread(
  post: PostThreadViewPostModel,
): Generator<PostThreadViewPostModel, void> {
  if (post.parent) {
    yield* flattenThread(post.parent)
  }
  yield post
  if (post.replies?.length) {
    for (const reply of post.replies) {
      yield* flattenThread(reply)
    }
  }
}
