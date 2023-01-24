import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollowers = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, `Followers of ${name}`)
      store.shell.setMinimalShellMode(false)
    }
  }, [store, visible, name, navIdx])

  return (
    <View>
      <ViewHeader title="Followers" subtitle={`of ${name}`} />
      <ProfileFollowersComponent name={name} />
    </View>
  )
}
