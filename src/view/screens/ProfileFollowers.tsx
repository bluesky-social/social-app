import React, {useEffect} from 'react'
import {View} from 'react-native'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {register} from 'react-native-bundle-splitter'

export const ProfileFollowers = register(
  ({navIdx, visible, params}: ScreenParams) => {
    const store = useStores()
    const {name} = params

    useEffect(() => {
      if (visible) {
        store.nav.setTitle(navIdx, `Followers of ${name}`)
      }
    }, [store, visible, name])

    return (
      <View>
        <ViewHeader title="Followers" subtitle={`of ${name}`} />
        <ProfileFollowersComponent name={name} />
      </View>
    )
  },
)
