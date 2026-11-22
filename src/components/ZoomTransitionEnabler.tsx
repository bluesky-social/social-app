import {useLayoutEffect} from 'react'
import {ZoomTransition} from '@bsky.app/expo-bluesky-swiss-army'
import {type ParamListBase, useNavigation} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

/**
 * Gives the screen it's rendered in a zoom transition on iOS 18+, out of the
 * matching `ZoomTransition.Source` on the previous screen.
 *
 * It also turns off react-native-screens' back gestures for the screen.
 * react-native-screens takes over the navigation controller's back swipes, so
 * with `fullScreenGestureEnabled` they race the zoom's own dismiss gestures,
 * and when one of them wins (a fast flick, or the swipe after a cancelled one)
 * the screen pops without following the finger. Plain UIKit leaves zoomed
 * screens to the zoom's gestures, and so does this.
 */
export function ZoomTransitionEnabler(
  props: React.ComponentProps<typeof ZoomTransition.Enabler>,
) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>()

  useLayoutEffect(() => {
    if (ZoomTransition.isSupported) {
      navigation.setOptions({gestureEnabled: false})
    }
  }, [navigation])

  return <ZoomTransition.Enabler {...props} />
}
