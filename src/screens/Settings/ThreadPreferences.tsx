import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {
  normalizeSort,
  normalizeView,
  useThreadPreferences,
} from '#/state/queries/preferences/useThreadPreferences'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>
export function ThreadPreferencesScreen({}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const {sort, setSort, view, setView} = useThreadPreferences({save: true})

  return (
    <Layout.Screen testID="threadPreferencesScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Thread Preferences</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={BubblesIcon} />
            <SettingsList.ItemText>
              <Trans>Sort replies</Trans>
            </SettingsList.ItemText>
            <View style={[a.w_full, a.gap_md]}>
              <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
                <Trans>Sort replies to the same post by:</Trans>
              </Text>
              <Toggle.Group
                label={_(msg`Sort replies by`)}
                type="radio"
                values={sort ? [sort] : []}
                onChange={values => setSort(normalizeSort(values[0]))}>
                <View style={[a.gap_sm, a.flex_1]}>
                  <Toggle.Item name="top" label={_(msg`Top replies first`)}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Top replies first</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item
                    name="oldest"
                    label={_(msg`Oldest replies first`)}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Oldest replies first</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item
                    name="newest"
                    label={_(msg`Newest replies first`)}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Newest replies first</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                </View>
              </Toggle.Group>
            </View>
          </SettingsList.Group>

          <SettingsList.Group>
            <SettingsList.ItemIcon icon={TreeIcon} />
            <SettingsList.ItemText>
              <Trans>Tree view</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              type="checkbox"
              name="threaded-mode"
              label={_(msg`Tree view`)}
              value={view === 'tree'}
              onChange={value =>
                setView(normalizeView({treeViewEnabled: value}))
              }
              style={[a.w_full, a.gap_md]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Show post replies in a threaded tree view</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
