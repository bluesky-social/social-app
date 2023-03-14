import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {useStores} from 'state/index'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>
export const ProfileFollowersScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const {name} = route.params

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Followers" />
      <ProfileFollowersComponent name={name} />
    </View>
  )
})
