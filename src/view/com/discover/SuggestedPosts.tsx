import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {SuggestedPostsView} from 'state/models/suggested-posts-view'
import {s} from 'lib/styles'
import {FeedItem as Post} from '../posts/FeedItem'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'

export const SuggestedPosts = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const suggestedPostsView = React.useMemo<SuggestedPostsView>(
    () => new SuggestedPostsView(store),
    [store],
  )

  React.useEffect(() => {
    if (!suggestedPostsView.hasLoaded) {
      suggestedPostsView.setup()
    }
  }, [store, suggestedPostsView])

  return (
    <>
      {(suggestedPostsView.hasContent || suggestedPostsView.isLoading) && (
        <Text type="title" style={[styles.heading, pal.text]}>
          Recently, on Bluesky...
        </Text>
      )}
      {suggestedPostsView.hasContent && (
        <>
          <View style={[pal.border, styles.bottomBorder]}>
            {suggestedPostsView.posts.map(item => (
              <Post item={item} key={item._reactKey} />
            ))}
          </View>
        </>
      )}
      {suggestedPostsView.isLoading && (
        <View style={s.mt10}>
          <ActivityIndicator />
        </View>
      )}
    </>
  )
})

const styles = StyleSheet.create({
  heading: {
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },

  bottomBorder: {
    borderBottomWidth: 1,
  },

  loadMore: {
    paddingLeft: 12,
    paddingVertical: 10,
  },
})
