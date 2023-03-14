import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {useStores} from 'state/index'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>
export const ProfileFollowsScreen = withAuthRequired(({route}: Props) => {
  const store = useStores()
  const {name} = route.params

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Following" />
      <ProfileFollowsComponent name={name} />
    </View>
  )
})
