import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  VotesViewModel,
  VotesViewItemModel,
} from '../../../state/models/votes-view'
import {Link} from '../util/Link'
import {Text} from '../util/Text'
import {ErrorMessage} from '../util/ErrorMessage'
import {UserAvatar} from '../util/UserAvatar'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const PostVotedBy = observer(function PostVotedBy({
  uri,
  direction,
}: {
  uri: string
  direction: 'up' | 'down'
}) {
  const store = useStores()
  const [view, setView] = useState<VotesViewModel | undefined>()

  useEffect(() => {
    if (view?.params.uri === uri) {
      console.log('Voted by doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching voted by', uri)
    const newView = new VotesViewModel(store, {uri, direction})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch voted by', err))
  }, [uri, view?.params.uri, store])

  const onRefresh = () => {
    view?.refresh()
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
  const renderItem = ({item}: {item: VotesViewItemModel}) => (
    <LikedByItem item={item} />
  )
  return (
    <View>
      <FlatList
        data={view.votes}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
      />
    </View>
  )
})

const LikedByItem = ({item}: {item: VotesViewItemModel}) => {
  return (
    <Link
      style={styles.outer}
      href={`/profile/${item.actor.handle}`}
      title={item.actor.handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={item.actor.displayName}
            handle={item.actor.handle}
            avatar={item.actor.avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold]}>
            {item.actor.displayName || item.actor.handle}
          </Text>
          <Text style={[s.f14, s.gray5]}>@{item.actor.handle}</Text>
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
