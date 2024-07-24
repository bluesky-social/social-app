import React from 'react'
import {View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {AllNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {
  RQKEY as RQKEY_NOTIFS,
  useNotificationFeedQuery,
} from '#/state/queries/notifications/feed'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationsSettings'>
export function NotificationsSettingsScreen({}: Props) {
  const {data, refetch} = useNotificationFeedQuery()
  const queryClient = useQueryClient()
  const agent = useAgent()
  const priority = data?.pages.at(0)?.priority

  const {_} = useLingui()
  const t = useTheme()

  const {mutate: onChangePriority, isPending} = useMutation({
    mutationFn: async (keys: string[]) => {
      const enabled = keys[0] === 'enabled'

      eagerlySetCachedPriority(queryClient, enabled)

      await agent.api.app.bsky.notification.putPreferences({
        priority: enabled,
      })

      await until(
        5, // 5 tries
        1e3, // 1s delay between tries
        res => res.data.priority === enabled,
        () => agent.api.app.bsky.notification.listNotifications({limit: 1}),
      )

      // in case the query revalidated while we were waiting
      eagerlySetCachedPriority(queryClient, enabled)
    },
    onError: (err, keys) => {
      const prev = keys[0] !== 'enabled'
      eagerlySetCachedPriority(queryClient, prev)
      refetch()
      logger.error('Failed to save notification preferences', {
        safeMessage: err,
      })
      Toast.show(
        _(msg`Failed to save notification preferences, please try again`),
        'xmark',
      )
    },
    onSuccess: () => {
      Toast.show(_(msg`Preference saved`))
    },
  })

  return (
    <CenteredView sideBorders style={a.h_full_vh}>
      <ViewHeader
        title={_(msg`Notification Settings`)}
        showOnDesktop
        showBorder
      />
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
          disabled={typeof priority !== 'boolean' || isPending}>
          <View>
            <Toggle.Item
              name="enabled"
              label={_(msg`Enable priority notifications`)}
              style={[a.justify_between, a.py_sm]}>
              <Toggle.LabelText>
                <Trans>Enable priority notifications</Trans>
              </Toggle.LabelText>
              {!data ? (
                <Loader size="md" />
              ) : isWeb ? (
                <Toggle.Checkbox />
              ) : (
                <Toggle.Switch />
              )}
            </Toggle.Item>
          </View>
        </Toggle.Group>
        <View
          style={[
            a.mt_sm,
            a.px_xl,
            a.py_lg,
            a.rounded_md,
            t.atoms.bg_contrast_25,
          ]}>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
            <Trans>
              Experimental: Filter your notifications. Currently this means
              you'll only receive notifications from users you follow — we'll
              refine this over time.
            </Trans>
          </Text>
        </View>
      </View>
    </CenteredView>
  )
}

function eagerlySetCachedPriority(
  queryClient: ReturnType<typeof useQueryClient>,
  enabled: boolean,
) {
  queryClient.setQueryData(RQKEY_NOTIFS(), (old: any) => {
    if (!old) return old
    return {
      ...old,
      pages: old.pages.map((page: any) => {
        return {
          ...page,
          priority: enabled,
        }
      }),
    }
  })
}
