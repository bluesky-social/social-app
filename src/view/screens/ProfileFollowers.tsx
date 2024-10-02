import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {useSetMinimalShellMode} from '#/state/shell'
import {ProfileFollowers as ProfileFollowersComponent} from '#/view/com/profile/ProfileFollowers'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'
import {ListHeaderDesktop} from '#/components/Lists'

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
    <Layout.Screen testID="profileFollowersScreen">
      <CenteredView sideBorders={true}>
        <ListHeaderDesktop title={_(msg`Followers`)} />
        <ViewHeader title={_(msg`Followers`)} showBorder={!isWeb} />
        <ProfileFollowersComponent name={name} />
      </CenteredView>
    </Layout.Screen>
  )
}
