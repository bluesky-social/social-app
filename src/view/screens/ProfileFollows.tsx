import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ScreenParams} from '../routes'
import {useStores} from 'state/index'

export const ProfileFollows = ({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle(navIdx, `Followed by ${name}`)
      store.shell.setMinimalShellMode(false)
    }
  }, [store, visible, name, navIdx])

  return (
    <View>
      <ViewHeader title="Following" />
      <ProfileFollowsComponent name={name} />
    </View>
  )
}
