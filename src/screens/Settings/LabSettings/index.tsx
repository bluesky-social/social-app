import {View} from 'react-native'
import {Trans} from '@lingui/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {type Gate, useGateDescriptions} from '#/lib/statsig/gates'
import {useGate} from '#/lib/statsig/statsig'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {FeatureGateDialog} from './FeatureGateDialog'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'LabSettings'>
export function LabSettingsScreen({}: Props) {
  const t = useTheme()
  const descriptions = useGateDescriptions()

  const gates: Gate[] = Object.entries(descriptions)
    .filter(([_k, v]) => !!v)
    .map(([k, _v]) => k as Gate)

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

      <Layout.Content>
        <View style={[a.p_lg, a.pb_0]}>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>Experimental features on Bluesky.</Trans>
          </Text>
        </View>
        <SettingsList.Container>
          {gates.map(gate => (
            <ExperimentButton key={gate} gate={gate} />
          ))}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function ExperimentButton({gate}: {gate: Gate}) {
  const t = useTheme()
  const ctrl = useDialogControl()
  const descriptions = useGateDescriptions()
  const gateApi = useGate()
  const enabled = gateApi(gate)
  return (
    <>
      <SettingsList.Divider />
      <SettingsList.PressableItem
        label={descriptions[gate]?.title || ''}
        onPress={() => ctrl.open()}>
        <SettingsList.ItemIcon icon={BeakerIcon} />
        <SettingsList.ItemText>
          {descriptions[gate]?.title}
        </SettingsList.ItemText>
        <SettingsList.BadgeText
          style={[
            a.flex_1,
            enabled && {
              color:
                t.scheme === 'dark'
                  ? t.palette.positive_400
                  : t.palette.positive_600,
            },
          ]}>
          {enabled ? <Trans>Enabled</Trans> : <Trans>Disabled</Trans>}
        </SettingsList.BadgeText>
      </SettingsList.PressableItem>
      <FeatureGateDialog control={ctrl} gate={gate} />
    </>
  )
}
