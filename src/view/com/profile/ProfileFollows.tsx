import React, {useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, RefreshControl, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {UserFollowsModel, FollowItem} from 'state/models/lists/user-follows'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {ProfileCardWithFollowBtn} from './ProfileCard'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {logger} from '#/logger'

export const ProfileFollows = observer(function ProfileFollows({
  name,
}: {
  name: string
}) {
  const pal = usePalette('default')
  const store = useStores()
  const view = React.useMemo(
    () => new UserFollowsModel(store, {actor: name}),
    [store, name],
  )

  useEffect(() => {
    view
      .loadMore()
      .catch(err => logger.error('Failed to fetch user follows', err))
  }, [view])

  const onRefresh = () => {
    view.refresh()
  }
  const onEndReached = () => {
    view
      .loadMore()
      .catch(err => logger.error('Failed to load more follows', err))
  }

  if (!view.hasLoaded) {
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
  const renderItem = ({item}: {item: FollowItem}) => (
    <ProfileCardWithFollowBtn key={item.did} profile={item} />
  )
  return (
    <FlatList
      data={view.follows}
      keyExtractor={item => item.did}
      refreshControl={
        <RefreshControl
          refreshing={view.isRefreshing}
          onRefresh={onRefresh}
          tintColor={pal.colors.text}
          titleColor={pal.colors.text}
        />
      }
      onEndReached={onEndReached}
      renderItem={renderItem}
      initialNumToRender={15}
      // FIXME(dan)
      // eslint-disable-next-line react/no-unstable-nested-components
      ListFooterComponent={() => (
        <View style={styles.footer}>
          {view.isLoading && <ActivityIndicator />}
        </View>
      )}
      extraData={view.isLoading}
      // @ts-ignore our .web version only -prf
      desktopFixedHeight
    />
  )
})

const styles = StyleSheet.create({
  footer: {
    height: 200,
    paddingTop: 20,
  },
})
