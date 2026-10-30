import {useLingui} from '@lingui/react/macro'

import {type NotificationSettingsPreference} from '#/state/queries/notifications/settings'

export function SettingPreview({
  preference,
}: {
  preference?: NotificationSettingsPreference
}) {
  const {t: l} = useLingui()

  if (!preference) {
    return null
  }

  if ('include' in preference) {
    const list = 'list' in preference && preference.list

    if (preference.include === 'all') {
      if (list && preference.push) return l`In-app, push, everyone`
      if (list) return l`In-app, everyone`
      if (preference.push) return l`Push, everyone`
    } else if (preference.include === 'follows') {
      if (list && preference.push) return l`In-app, push, people you follow`
      if (list) return l`In-app, people you follow`
      if (preference.push) return l`Push, people you follow`
    }
  } else {
    if (preference.list && preference.push) return l`In-app, push`
    if (preference.list) return l`In-app`
    if (preference.push) return l`Push`
  }

  return l`Off`
}
