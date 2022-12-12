import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollows = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, `Followed by ${name}`)
    }
  }, [store, visible, name])

  return (
    <View>
      <ViewHeader title="Followed" subtitle={`by ${name}`} />
      <ProfileFollowsComponent name={name} />
    </View>
  )
}
