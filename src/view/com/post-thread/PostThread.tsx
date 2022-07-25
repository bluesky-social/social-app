import React, {useState, useEffect, useRef} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, Text, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {OnNavigateContent} from '../../routes/types'
import {
  PostThreadViewModel,
  PostThreadViewPostModel,
} from '../../../state/models/post-thread-view'
import {useStores} from '../../../state'
import {PostThreadItem} from './PostThreadItem'
import {ShareBottomSheet} from '../sheets/SharePost'
import {s} from '../../lib/styles'

const UPDATE_DELAY = 2e3 // wait 2s before refetching the thread for updates

export const PostThread = observer(function PostThread({
  uri,
  onNavigateContent,
}: {
  uri: string
  onNavigateContent: OnNavigateContent
}) {
  const store = useStores()
  const [view, setView] = useState<PostThreadViewModel | undefined>()
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const shareSheetRef = useRef<{open: (uri: string) => void}>()

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

  useFocusEffect(() => {
    if (Date.now() - lastUpdate > UPDATE_DELAY) {
      view?.update()
      setLastUpdate(Date.now())
    }
  })

  const onPressShare = (uri: string) => {
    shareSheetRef.current?.open(uri)
  }
  const onRefresh = () => {
    view?.refresh().catch(err => console.error('Failed to refresh', err))
  }

  // loading
  // =
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
  // =
  if (view.hasError) {
    return (
      <View>
        <Text>{view.error}</Text>
      </View>
    )
  }

  // loaded
  // =
  const posts = view.thread ? Array.from(flattenThread(view.thread)) : []
  const renderItem = ({item}: {item: PostThreadViewPostModel}) => (
    <PostThreadItem
      item={item}
      onNavigateContent={onNavigateContent}
      onPressShare={onPressShare}
    />
  )
  return (
    <View style={s.h100pct}>
      <FlatList
        data={posts}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
        refreshing={view.isRefreshing}
        onRefresh={onRefresh}
      />
      <ShareBottomSheet ref={shareSheetRef} />
    </View>
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
