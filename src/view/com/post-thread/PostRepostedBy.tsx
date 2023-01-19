import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native'
import {
  RepostedByViewModel,
  RepostedByItem,
} from '../../../state/models/reposted-by-view'
import {UserAvatar} from '../util/UserAvatar'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {useStores} from '../../../state'
import {s, colors} from '../../lib/styles'

export const PostRepostedBy = observer(function PostRepostedBy({
  uri,
}: {
  uri: string
}) {
  const store = useStores()
  const view = React.useMemo(
    () => new RepostedByViewModel(store, {uri}),
    [store, uri],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => store.log.error('Failed to fetch user followers', err))
  }, [view, store.log])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err =>
        view?.rootStore.log.error('Failed to load more followers', err),
      )
  }

  if (!view.hasLoaded) {
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
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onRefresh}
        />
      </View>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: RepostedByItem}) => (
    <RepostedByItemCom item={item} />
  )
  return (
    <FlatList
      data={view.repostedBy}
      keyExtractor={item => item.did}
      refreshing={view.isRefreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      renderItem={renderItem}
      initialNumToRender={15}
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {view.isLoading && <ActivityIndicator />}
        </View>
      )}
      extraData={view.isLoading}
    />
  )
})

const RepostedByItemCom = ({item}: {item: RepostedByItem}) => {
  return (
    <Link
      style={styles.outer}
      href={`/profile/${item.handle}`}
      title={item.handle}
      noFeedback>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar
            size={40}
            displayName={item.displayName}
            handle={item.handle}
            avatar={item.avatar}
          />
        </View>
        <View style={styles.layoutContent}>
          <Text style={[s.f15, s.bold]}>{item.displayName || item.handle}</Text>
          <Text style={[s.f14, s.gray5]}>@{item.handle}</Text>
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
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
