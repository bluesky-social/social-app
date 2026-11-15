import {type BottomTabNavigationProp} from '@react-navigation/bottom-tabs'
import {
  CommonActions,
  type CompositeNavigationProp,
  type NavigationProp as BaseNavigationProp,
  type NavigationState,
  type ParamListBase,
  StackActions,
} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type SidebarTab} from '#/lib/routes/tab-to-nav-item'
import {
  type BottomTabNavigatorParams,
  type CommonNavigationDestination,
  type CommonNavigatorParams,
} from '#/lib/routes/types'
import {
  type MessagesParams,
  type NavigationMode,
  type NavigatorState,
} from './actions'

export type RootNavigatorParams = BottomTabNavigatorParams
export type RootNavigationProp = BaseNavigationProp<RootNavigatorParams>

/** Native screen navigation, scoped to the known child stack and current route. */
export type NavigationProp<
  ParamList extends ParamListBase = CommonNavigatorParams,
  RouteName extends keyof ParamList & string = keyof ParamList & string,
> = CompositeNavigationProp<
  NativeStackNavigationProp<ParamList, RouteName>,
  BottomTabNavigationProp<RootNavigatorParams>
>

/** Select a tab without replacing its existing child stack. */
export function getTabNavigationAction(tab: SidebarTab, _profileName = 'me') {
  const name: keyof RootNavigatorParams = `${tab}Tab`
  return CommonActions.navigate(name)
}

export function getTabResetAction(tab: SidebarTab) {
  const name: keyof RootNavigatorParams = `${tab}Tab`
  return CommonActions.reset({index: 0, routes: [{name}]})
}

/** Prefer the local Home screen when the current stack owns it. */
export function getHomeNavigationAction(
  state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  if (state?.routeNames.includes('Home')) {
    return mode === 'replace'
      ? StackActions.replace('Home')
      : CommonActions.navigate('Home')
  }
  return CommonActions.navigate('HomeTab', {screen: 'Home'})
}

/** Conversations can be opened in any native stack, including outside MessagesTab. */
export function getMessagesNavigationAction(
  params?: MessagesParams,
  state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  if (state?.routeNames.includes('Messages')) {
    return mode === 'replace'
      ? StackActions.replace('Messages', params)
      : CommonActions.navigate('Messages', params)
  }
  return CommonActions.navigate('MessagesTab', {screen: 'Messages', params})
}

/** Keep external common destinations in the active tab, with Home as the startup fallback. */
export function getCommonNavigationAction(
  destination: CommonNavigationDestination,
  state?: NavigationState,
) {
  const tab = state?.routes[state.index]?.name ?? 'HomeTab'
  return CommonActions.navigate(tab, {
    screen: destination.name,
    params: destination.params,
  })
}
