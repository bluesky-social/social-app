import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {
  usePreferencesQuery,
  useSetThreadViewPreferencesMutation,
} from '#/state/queries/preferences'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesThreads'>
export function ThreadPreferencesScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()

  const {data: preferences} = usePreferencesQuery()
  const {mutate: setThreadViewPrefs, variables} =
    useSetThreadViewPreferencesMutation()

  const sortReplies = variables?.sort ?? preferences?.threadViewPrefs?.sort

  const prioritizeFollowedUsers = Boolean(
    variables?.prioritizeFollowedUsers ??
      preferences?.threadViewPrefs?.prioritizeFollowedUsers,
  )
  const treeViewEnabled = Boolean(
    variables?.lab_treeViewEnabled ??
      preferences?.threadViewPrefs?.lab_treeViewEnabled,
  )

  return (
    <Layout.Screen testID="threadPreferencesScreen">
      <Layout.Header title={_(msg`Thread Preferences`)} />
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
                values={sortReplies ? [sortReplies] : []}
                onChange={values => setThreadViewPrefs({sort: values[0]})}>
                <View style={[a.gap_sm, a.flex_1]}>
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
                  <Toggle.Item
                    name="most-likes"
                    label={_(msg`Most-liked replies first`)}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Most-liked first</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item
                    name="random"
                    label={_(msg`Random (aka "Poster's Roulette")`)}>
                    <Toggle.Radio />
                    <Toggle.LabelText>
                      <Trans>Random (aka "Poster's Roulette")</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                </View>
              </Toggle.Group>
            </View>
          </SettingsList.Group>
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={PersonGroupIcon} />
            <SettingsList.ItemText>
              <Trans>Prioritize your Follows</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              type="checkbox"
              name="prioritize-follows"
              label={_(msg`Prioritize your Follows`)}
              value={prioritizeFollowedUsers}
              onChange={value =>
                setThreadViewPrefs({
                  prioritizeFollowedUsers: value,
                })
              }
              style={[a.w_full, a.gap_md]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Show replies by people you follow before all other replies
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
          <SettingsList.Divider />
          <SettingsList.Group>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>Experimental</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              type="checkbox"
              name="threaded-mode"
              label={_(msg`Threaded mode`)}
              value={treeViewEnabled}
              onChange={value =>
                setThreadViewPrefs({
                  lab_treeViewEnabled: value,
                })
              }
              style={[a.w_full, a.gap_md]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Show replies in a threaded view</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
