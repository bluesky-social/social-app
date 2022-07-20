import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, Text, View} from 'react-native'
import {OnNavigateContent} from '../../routes/types'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from '../../../state/models/post-thread-view'
import {useStores} from '../../../state'
import {PostThreadItem} from './PostThreadItem'

export const PostThread = observer(function PostThread({
  uri,
  onNavigateContent,
}: {
  uri: string
  onNavigateContent: OnNavigateContent
}) {
  const store = useStores()
  const [view, setView] = useState<PostThreadViewModel | undefined>()

  useEffect(() => {
    if (view?.params.uri === uri) {
      console.log('Post thread doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching post thread', uri)
    const newView = new PostThreadViewModel(store, {uri})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch thread', err))
  }, [uri, view?.params.uri, store])

  // not yet setup
  if (
    !view ||
    (view.isLoading && !view.isRefreshing) ||
    view.params.uri !== uri
  ) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  if (view.hasError) {
    return (
      <View>
        <Text>{view.error}</Text>
      </View>
    )
  }

  // rendering
  const posts = Array.from(flattenThread(view.thread))
  const renderItem = ({item}: {item: PostThreadViewPostModel}) => (
    <PostThreadItem item={item} onNavigateContent={onNavigateContent} />
  )
  const onRefresh = () => {
    view.refresh().catch(err => console.error('Failed to refresh', err))
  }
  return (
    <View>
      {view.isRefreshing && <ActivityIndicator />}
      {view.hasContent && (
        <FlatList
          data={posts}
          keyExtractor={item => item._reactKey}
          renderItem={renderItem}
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  )
})

function* flattenThread(
  post: PostThreadViewPostModel,
): Generator<PostThreadViewPostModel, void> {
  yield post
  if (post.replies?.length) {
    for (const reply of post.replies) {
      yield* flattenThread(reply)
    }
  }
}
