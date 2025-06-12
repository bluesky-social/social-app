import {useMemo} from 'react'
import {View} from 'react-native'
import {type AppBskyNotificationDefs} from '@atproto/api'
import {type FilterablePreference} from '@atproto/api/dist/client/types/app/bsky/notification/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNotificationSettingsUpdateMutation} from '#/state/queries/notifications/settings'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {Divider} from '../../components/SettingsList'

export function PreferenceControls({
  name,
  syncOthers,
  preference,
  allowDisableInApp = true,
}: {
  name: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>
  syncOthers?: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>[]
  preference?: AppBskyNotificationDefs.Preference | FilterablePreference
  allowDisableInApp?: boolean
}) {
  if (!preference)
    return (
      <View style={[a.w_full, a.pt_5xl, a.align_center]}>
        <Loader size="xl" />
      </View>
    )

  return (
    <Inner
      name={name}
      syncOthers={syncOthers}
      preference={preference}
      allowDisableInApp={allowDisableInApp}
    />
  )
}

export function Inner({
  name,
  syncOthers = [],
  preference,
  allowDisableInApp,
}: {
  name: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>
  syncOthers?: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>[]
  preference: AppBskyNotificationDefs.Preference | FilterablePreference
  allowDisableInApp: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutate} = useNotificationSettingsUpdateMutation()

  const channels = useMemo(() => {
    const arr = []
    if (preference.list) arr.push('list')
    if (preference.push) arr.push('push')
    return arr
  }, [preference])

  const onChangeChannels = (change: string[]) => {
    const newPreference = {
      ...preference,
      list: change.includes('list'),
      push: change.includes('push'),
    } satisfies typeof preference

    mutate({
      [name]: newPreference,
      ...Object.fromEntries(syncOthers.map(key => [key, newPreference])),
    })
  }

  const onChangeFilter = ([change]: string[]) => {
    if (change !== 'all' && change !== 'follows')
      throw new Error('Invalid filter')

    const newPreference = {
      ...preference,
      filter: change,
    } satisfies typeof preference

    mutate({
      [name]: newPreference,
      ...Object.fromEntries(syncOthers.map(key => [key, newPreference])),
    })
  }

  return (
    <View style={[a.px_xl, a.pt_md, a.gap_sm]}>
      <Toggle.Group
        type="checkbox"
        label={_('Change which channels you can receive notifications from')}
        values={channels}
        onChange={onChangeChannels}>
        <View style={[a.gap_sm]}>
          <Toggle.Item
            label={_(msg`Receive push notifications`)}
            name="push"
            style={[a.justify_between, a.py_xs]}>
            <Toggle.LabelText style={[t.atoms.text, a.font_normal, a.text_md]}>
              <Trans>Push notifications</Trans>
            </Toggle.LabelText>
            <Toggle.Platform />
          </Toggle.Item>
          {allowDisableInApp && (
            <Toggle.Item
              label={_(msg`Receive in-app notifications`)}
              name="list"
              style={[a.justify_between, a.py_xs]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md]}>
                <Trans>In-app notifications</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          )}
        </View>
      </Toggle.Group>
      {preference.$type ===
        'app.bsky.notification.defs#filterablePreference' && (
        <>
          <Divider />
          <Text style={[a.font_bold, a.text_md]}>From</Text>
          <Toggle.Group
            type="radio"
            label={_('Filter who you receive notifications from')}
            values={[preference.filter]}
            onChange={onChangeFilter}>
            <View style={[a.gap_sm]}>
              <Toggle.Item
                label={_(msg`Everyone`)}
                name="all"
                style={[a.flex_row, a.gap_sm, a.py_xs]}>
                <Toggle.Radio />
                <Toggle.LabelText
                  style={[t.atoms.text, a.font_normal, a.text_md]}>
                  <Trans>Push notifications</Trans>
                </Toggle.LabelText>
              </Toggle.Item>
              {allowDisableInApp && (
                <Toggle.Item
                  label={_(msg`People I follow`)}
                  name="follows"
                  style={[a.flex_row, a.gap_sm, a.py_xs]}>
                  <Toggle.Radio />
                  <Toggle.LabelText
                    style={[t.atoms.text, a.font_normal, a.text_md]}>
                    <Trans>People I follow</Trans>
                  </Toggle.LabelText>
                </Toggle.Item>
              )}
            </View>
          </Toggle.Group>
        </>
      )}
    </View>
  )
}
