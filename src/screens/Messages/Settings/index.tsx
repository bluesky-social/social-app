import React from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesSettings'>
export function MessagesSettingsScreen({}: Props) {
  const {_} = useLingui()

  const gate = useGate()
  if (!gate('dms')) return <ClipClopGate />

  return (
    <View>
      <ViewHeader title={_(msg`Settings`)} showOnDesktop />
    </View>
  )
}
