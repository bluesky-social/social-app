import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, FlatList, View} from 'react-native'
import {MembersViewModel, MemberItem} from '../../../state/models/members-view'
import {ProfileCard} from './ProfileCard'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {useStores} from '../../../state'

export const ProfileMembers = observer(function ProfileMembers({
  name,
}: {
  name: string
}) {
  const store = useStores()
  const [view, setView] = useState<MembersViewModel | undefined>()

  useEffect(() => {
    if (view?.params.actor === name) {
      console.log('Members doing nothing')
      return // no change needed? or trigger refresh?
    }
    console.log('Fetching members', name)
    const newView = new MembersViewModel(store, {actor: name})
    setView(newView)
    newView.setup().catch(err => console.error('Failed to fetch members', err))
  }, [name, view?.params.actor, store])

  const onRefresh = () => {
    view?.refresh()
  }

  // loading
  // =
  if (
    !view ||
    (view.isLoading && !view.isRefreshing) ||
    view.params.actor !== name
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
          message={view.error}
          style={{margin: 6}}
          onPressTryAgain={onRefresh}
        />
      </View>
    )
  }

  // loaded
  // =
  const renderItem = ({item}: {item: MemberItem}) => (
    <ProfileCard
      did={item.did}
      handle={item.handle}
      displayName={item.displayName}
      avatar={item.avatar}
    />
  )
  return (
    <View>
      <FlatList
        data={view.members}
        keyExtractor={item => item._reactKey}
        renderItem={renderItem}
      />
    </View>
  )
})
