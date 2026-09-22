import {useCallback} from 'react'

import {useFocusEffect} from '#/lib/navigation'
import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'

type Props = NativeStackScreenProps<
  AllNavigatorParams,
  'LegacyNotificationSettings'
>
export function LegacyNotificationSettingsScreen({navigation}: Props) {
  useFocusEffect(
    useCallback(() => {
      navigation.replace('NotificationSettings')
    }, [navigation]),
  )

  return null
}
