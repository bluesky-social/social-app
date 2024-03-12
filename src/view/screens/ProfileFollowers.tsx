import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import React from 'react'
import {View} from 'react-native'

import {useSetMinimalShellMode} from '#/state/shell'

import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>
export const ProfileFollowersScreen = ({route}: Props) => {
  const {name} = route.params
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Followers`)} />
      <ProfileFollowersComponent name={name} />
    </View>
  )
}
