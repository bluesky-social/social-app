import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import * as SettingsList from '#/screens/Settings/components/SettingsList'
import * as Toggle from '#/components/forms/Toggle'
import {Live_Stroke2_Corner0_Rounded as LiveIcon} from '#/components/icons/Live'
import {
  useLiveEventPreferences,
  useUpdateLiveEventPreferences,
} from '#/features/liveEvents/preferences'

export function LiveEventFeedsSettingsToggle() {
  const {_} = useLingui()
  const {data: prefs} = useLiveEventPreferences()
  const {
    isPending,
    data: updatedPrefs,
    mutate: update,
  } = useUpdateLiveEventPreferences({
    metricContext: 'settings',
  })
  const hideAllFeeds = !!(updatedPrefs || prefs)?.hideAllFeeds

  return (
    <Toggle.Item
      name="enable_live_event_banner"
      label={_(msg`Show live events in your Discover Feed`)}
      value={!hideAllFeeds}
      onChange={() => {
        if (!isPending) {
          update({type: 'toggleHideAllFeeds'})
        }
      }}>
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={LiveIcon} />
        <SettingsList.ItemText>
          <Trans>Show live events in your Discover Feed</Trans>
        </SettingsList.ItemText>
        <Toggle.Platform />
      </SettingsList.Item>
    </Toggle.Item>
  )
}
