import {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
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
