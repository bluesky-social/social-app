import {Text} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AllNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {useNotificationFeedQuery} from '#/state/queries/notifications/feed'
import {useNotificationSettingsMutation} from '#/state/queries/notifications/settings'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Error} from '#/components/Error'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as SettingsList from './components/SettingsList'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationSettings'>
export function NotificationSettingsScreen({}: Props) {
  const {_} = useLingui()

  const {data, isError: isQueryError, refetch} = useNotificationFeedQuery()
  const serverPriority = data?.pages.at(0)?.priority

  const {
    mutate: onChangePriority,
    isPending: isMutationPending,
    variables,
  } = useNotificationSettingsMutation()

  const priority = isMutationPending
    ? variables[0] === 'enabled'
    : serverPriority

  return (
    <Layout.Screen>
      <Layout.Header title={_(msg`Notification Settings`)} />
      <Layout.Content>
        {isQueryError ? (
          <Error
            title={_(msg`Oops!`)}
            message={_(msg`Something went wrong!`)}
            onRetry={refetch}
            sideBorders={false}
          />
        ) : (
          <SettingsList.Container>
            <SettingsList.Group>
              <SettingsList.ItemIcon icon={BeakerIcon} />
              <SettingsList.ItemText>
                <Trans>Notification filters</Trans>
              </SettingsList.ItemText>
              <Toggle.Group
                label={_(msg`Priority notifications`)}
                type="checkbox"
                values={priority ? ['enabled'] : []}
                onChange={onChangePriority}
                disabled={typeof priority !== 'boolean' || isMutationPending}>
                <Toggle.Item
                  name="enabled"
                  label={_(msg`Enable priority notifications`)}
                  style={[a.flex_1, a.justify_between]}>
                  <Toggle.LabelText>
                    <Trans>Enable priority notifications</Trans>
                  </Toggle.LabelText>
                  {!data ? <Loader size="md" /> : <Toggle.Platform />}
                </Toggle.Item>
              </Toggle.Group>
            </SettingsList.Group>
            <SettingsList.Item>
              <Admonition type="warning" style={[a.flex_1]}>
                <Trans>
                  <Text style={[a.font_bold]}>Experimental:</Text> When this
                  preference is enabled, you'll only receive reply and quote
                  notifications from users you follow. We'll continue to add
                  more controls here over time.
                </Trans>
              </Admonition>
            </SettingsList.Item>
          </SettingsList.Container>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}
