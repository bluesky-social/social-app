import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native'
import {
  LikedByViewModel,
  LikedByViewItemModel,
} from '../../../state/models/liked-by-view'
import {Link} from '../util/Link'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const PostLikedBy = observer(function PostLikedBy({uri}: {uri: string}) {
  const store = useStores()
  const [view, setView] = useState<LikedByViewModel | undefined>()

  useEffect(() => {
    if (view?.params.uri === uri) {
      console.log('Liked by doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching Liked by', uri)
    const newView = new LikedByViewModel(store, {uri})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch liked by', err))
  }, [uri, view?.params.uri, store])

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
  const renderItem = ({item}: {item: LikedByViewItemModel}) => (
    <LikedByItem item={item} />
  )
  return (
    <View>
      <FlatList
        data={view.likedBy}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
      />
    </View>
  )
})

const LikedByItem = ({item}: {item: LikedByViewItemModel}) => {
  return (
    <Link style={styles.outer} href={`/profile/${item.name}`} title={item.name}>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={item.displayName}
            name={item.name}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold]}>{item.displayName}</Text>
          <Text style={[s.f14, s.gray5]}>@{item.name}</Text>
        </View>
      </View>
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    marginTop: 1,
    backgroundColor: colors.white,
  },
  layout: {
    flexDirection: 'row',
  },
  layoutAvi: {
    width: 60,
    paddingLeft: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
})
