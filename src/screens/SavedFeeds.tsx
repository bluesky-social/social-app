import {useEffect} from 'react'
import {View} from 'react-native'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>

/**
 * This screen has been consolidated into the main Feeds screen.
 * Redirect users there automatically.
 */
export function SavedFeeds({}: Props) {
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    // Replace current screen with Feeds to avoid back-navigation issues
    navigation.replace('Feeds')
  }, [navigation])

  // Show empty view while redirecting
  return <View />
}
