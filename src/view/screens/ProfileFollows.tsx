import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewHeader} from '../com/util/ViewHeader'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {useSetMinimalShellMode} from '#/state/shell'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>
export const ProfileFollowsScreen = withAuthRequired(
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
        <ViewHeader title={_(msg`Following`)} />
        <ProfileFollowsComponent name={name} />
      </View>
    )
  },
  {isPublic: true},
)
