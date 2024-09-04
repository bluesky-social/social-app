import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {isWeb} from 'platform/detection'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a} from '#/alf'
import {ListHeaderDesktop} from '#/components/Lists'
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
    <CenteredView style={a.util_screen_outer} sideBorders={true}>
      <ListHeaderDesktop title={_(msg`Followers`)} />
      <ViewHeader title={_(msg`Followers`)} showBorder={!isWeb} />
      <ProfileFollowersComponent name={name} />
    </CenteredView>
  )
}
