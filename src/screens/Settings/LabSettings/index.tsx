import {useState} from 'react'
import {Alert, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LabSettings'>
export function LabSettingsScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const gate = useGate()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>The Lab</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content contentContainerStyle={[a.p_lg]}>
        <Text
          style={[
            a.text_md,
            a.mt_xl,
            a.mb_sm,
            a.font_bold,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>The Lab (TODO)</Trans>
        </Text>
      </Layout.Content>
    </Layout.Screen>
  )
}
