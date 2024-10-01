import React from 'react'
import {View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AllNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {useNotificationFeedQuery} from '#/state/queries/notifications/feed'
import {useNotificationsSettingsMutation} from '#/state/queries/notifications/settings'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Error} from '#/components/Error'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationsSettings'>
export function NotificationsSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()

  const {data, isError: isQueryError, refetch} = useNotificationFeedQuery()
  const serverPriority = data?.pages.at(0)?.priority

  const {
    mutate: onChangePriority,
    isPending: isMutationPending,
    variables,
  } = useNotificationsSettingsMutation()

  const priority = isMutationPending
    ? variables[0] === 'enabled'
    : serverPriority

  return (
    <Layout.Screen>
      <ScrollView stickyHeaderIndices={[0]}>
        <ViewHeader
          title={_(msg`Notification Settings`)}
          showOnDesktop
          showBorder
        />
        {isQueryError ? (
          <Error
            title={_(msg`Oops!`)}
            message={_(msg`Something went wrong!`)}
            onRetry={refetch}
            sideBorders={false}
          />
        ) : (
          <View style={[a.p_lg, a.gap_md]}>
            <Text style={[a.text_lg, a.font_bold]}>
              <FontAwesomeIcon icon="flask" style={t.atoms.text} />{' '}
              <Trans>Notification filters</Trans>
            </Text>
            <Toggle.Group
              label={_(msg`Priority notifications`)}
              type="checkbox"
              values={priority ? ['enabled'] : []}
              onChange={onChangePriority}
              disabled={typeof priority !== 'boolean' || isMutationPending}>
              <View>
                <Toggle.Item
                  name="enabled"
                  label={_(msg`Enable priority notifications`)}
                  style={[a.justify_between, a.py_sm]}>
                  <Toggle.LabelText>
                    <Trans>Enable priority notifications</Trans>
                  </Toggle.LabelText>
                  {!data ? <Loader size="md" /> : <Toggle.Platform />}
                </Toggle.Item>
              </View>
            </Toggle.Group>
            <Admonition type="warning" style={[a.mt_sm]}>
              <Trans>
                Experimental: When this preference is enabled, you'll only
                receive reply and quote notifications from users you follow.
                We'll continue to add more controls here over time.
              </Trans>
            </Admonition>
          </View>
        )}
      </ScrollView>
    </Layout.Screen>
  )
}
