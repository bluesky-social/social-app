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
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileFollows'>
export const ProfileFollowsScreen = ({route}: Props) => {
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
      <ListHeaderDesktop title={_(msg`Following`)} />
      <ViewHeader title={_(msg`Following`)} showBorder={!isWeb} />
      <ProfileFollowsComponent name={name} />
    </CenteredView>
  )
}
