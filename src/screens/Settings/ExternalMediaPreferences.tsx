import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {
  EmbedPlayerSource,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from '#/state/preferences'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import * as Toggle from '#/components/forms/Toggle'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import * as Layout from '#/components/Layout'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesExternalEmbeds'
>
export function ExternalMediaPreferencesScreen({}: Props) {
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
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={MacintoshIcon} />
            <SettingsList.ItemText>
              <Trans>Enable media players for</Trans>
            </SettingsList.ItemText>
            <View style={[a.mt_sm, a.gap_md]}>
              {Object.entries(externalEmbedLabels)
                // TODO: Remove special case when we disable the old integration.
                .filter(([key]) => key !== 'tenor')
                .map(([key, label]) => (
                  <PrefSelector
                    source={key as EmbedPlayerSource}
                    label={label}
                    key={key}
                  />
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
      }>
      <Toggle.Checkbox />
      <Toggle.LabelText style={[a.text_md]}>{label}</Toggle.LabelText>
    </Toggle.Item>
  )
}
