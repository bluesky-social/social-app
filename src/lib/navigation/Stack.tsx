import {withLayoutContext} from 'expo-router'
import {type NativeStackNavigationEventMap} from 'expo-router/native-stack'
import {
  type ParamListBase,
  type StackNavigationState,
} from 'expo-router/react-navigation'

import {
  createNativeStackNavigatorWithAuth,
  type NativeStackNavigationOptionsWithAuth,
} from '#/view/shell/createNativeStackNavigatorWithAuth'

const Navigator = createNativeStackNavigatorWithAuth<ParamListBase>().Navigator

/** File-based stack with the app's authentication gates and web screen cache. */
export const Stack = withLayoutContext<
  NativeStackNavigationOptionsWithAuth,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator)
