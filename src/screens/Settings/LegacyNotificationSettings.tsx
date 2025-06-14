import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

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
