import {useCallback} from 'react'
import {Text, View} from 'react-native'
import {Trans} from '@lingui/macro'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {useNotificationSettingsQuery} from '#/state/queries/notifications/settings'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Bell_Filled_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import * as SettingsList from '../components/SettingsList'
import {ItemTextWithSubtitle} from './components/ItemTextWithSubtitle'
import {PreferenceControls} from './components/PreferenceControls'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'ActivityNotificationSettings'
>
export function ActivityNotificationSettingsScreen({}: Props) {
  const t = useTheme()
  const {data: preferences, isError} = useNotificationSettingsQuery()

  // TODO: Fetch subscriptions
  const items = [] as string[]

  const renderItem = useCallback(() => {
    return null
  }, [])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Notifications</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <List
        ListHeaderComponent={
          <SettingsList.Container>
            <SettingsList.Item style={[a.align_start]}>
              <SettingsList.ItemIcon icon={BellRingingIcon} />
              <ItemTextWithSubtitle
                bold
                titleText={<Trans>Activity alerts</Trans>}
                subtitleText={
                  <Trans>
                    Activity Alerts notify you instantly when your favorite
                    accounts post or reply.
                  </Trans>
                }
              />
            </SettingsList.Item>
            {isError ? (
              <View style={[a.px_lg, a.pt_md]}>
                <Admonition.Admonition type="error">
                  <Trans>Failed to load notification settings.</Trans>
                </Admonition.Admonition>
              </View>
            ) : (
              <PreferenceControls
                name="subscribedPost"
                preference={preferences?.subscribedPost}
              />
            )}
          </SettingsList.Container>
        }
        data={items}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={[a.px_xl, a.py_md]}>
            <Admonition.Outer type="tip">
              <Admonition.Row>
                <Admonition.Icon />
                <View style={[a.flex_1, a.gap_sm]}>
                  <Admonition.Text>
                    <Trans>
                      Enable activity alerts for an account by visiting their
                      profile and pressing the{' '}
                      <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
                        bell icon
                      </Text>{' '}
                      <BellIcon size="xs" style={t.atoms.text_contrast_high} />.
                    </Trans>
                  </Admonition.Text>
                  <Admonition.Text>
                    <Trans>
                      By default, only accounts you follow can receive alerts
                      from you – this can be changed in{' '}
                      <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
                        Settings &rarr; Privacy &amp; Security
                      </Text>
                      .
                    </Trans>
                  </Admonition.Text>
                </View>
              </Admonition.Row>
            </Admonition.Outer>
          </View>
        }
        ListFooterComponent={
          <ListFooter
            style={[items.length === 0 && a.border_transparent]}
            // isFetchingNextPage={isFetchingNextPage}
            // error={cleanError(error)}
            // onRetry={fetchNextPage}
          />
        }
      />
    </Layout.Screen>
  )
}
