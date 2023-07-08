import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollowersYouKnow as ProfileFollowersYouKnowComponent} from '../com/profile/ProfileFollowersYouKnow'
import {useStores} from 'state/index'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowersYouKnow'>
export const ProfileFollowersYouKnowScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const {name} = route.params

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Followers You Know" />
      <ProfileFollowersYouKnowComponent name={name} />
    </View>
  )
})
