import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {useSetMinimalShellMode} from '#/state/shell'
import {ProfileFollows as ProfileFollowsComponent} from '#/view/com/profile/ProfileFollows'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import * as Layout from '#/components/Layout'
import {ListHeaderDesktop} from '#/components/Lists'

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
    <Layout.Screen testID="profileFollowsScreen">
      <CenteredView sideBorders={true}>
        <ListHeaderDesktop title={_(msg`Following`)} />
        <ViewHeader title={_(msg`Following`)} showBorder={!isWeb} />
        <ProfileFollowsComponent name={name} />
      </CenteredView>
    </Layout.Screen>
  )
}
