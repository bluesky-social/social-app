import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollowers'>
export const ProfileFollowersScreen = withAuthRequired(
  ({route}: Props) => {
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
  },
  {isPublic: true},
)
