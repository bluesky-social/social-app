import {Fragment} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {
  EmbedPlayerSource,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from '#/state/preferences'
import {atoms as a, native} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesExternalEmbeds'
>
export function ExternalMediaPreferencesScreen({}: Props) {
  const {_} = useLingui()
  return (
    <Layout.Screen testID="externalMediaPreferencesScreen">
      <Layout.Header title={_(msg`External Media Preferences`)} />
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                External media may allow websites to collect information about
                you and your device. No information is sent or requested until
                you press the "play" button.
              </Trans>
            </Admonition>
          </SettingsList.Item>
          <SettingsList.Group iconInset={false}>
            <SettingsList.ItemText>
              <Trans>Enable media players for</Trans>
            </SettingsList.ItemText>
            <View style={[a.mt_sm, a.w_full]}>
              {native(<SettingsList.Divider style={[a.my_0]} />)}
              {Object.entries(externalEmbedLabels)
                // TODO: Remove special case when we disable the old integration.
                .filter(([key]) => key !== 'tenor')
                .map(([key, label]) => (
                  <Fragment key={key}>
                    <PrefSelector
                      source={key as EmbedPlayerSource}
                      label={label}
                      key={key}
                    />
                    {native(<SettingsList.Divider style={[a.my_0]} />)}
                  </Fragment>
                ))}
            </View>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function PrefSelector({
  source,
  label,
}: {
  source: EmbedPlayerSource
  label: string
}) {
  const setExternalEmbedPref = useSetExternalEmbedPref()
  const sources = useExternalEmbedsPrefs()

  return (
    <Toggle.Item
      name={label}
      label={label}
      type="checkbox"
      value={sources?.[source] === 'show'}
      onChange={() =>
        setExternalEmbedPref(
          source,
          sources?.[source] === 'show' ? 'hide' : 'show',
        )
      }
      style={[
        a.flex_1,
        a.py_md,
        native([a.justify_between, a.flex_row_reverse]),
      ]}>
      <Toggle.Platform />
      <Toggle.LabelText style={[a.text_md]}>{label}</Toggle.LabelText>
    </Toggle.Item>
  )
}
