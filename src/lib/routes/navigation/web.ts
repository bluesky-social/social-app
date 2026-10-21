import {
  CommonActions,
  type NavigationProp as BaseNavigationProp,
  type NavigationState,
  type ParamListBase,
  StackActions,
} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type SidebarTab} from '#/lib/routes/tab-to-nav-item'
import {
  type CommonNavigationDestination,
  type FlatNavigatorParams,
} from '#/lib/routes/types'
import {
  type MessagesParams,
  type NavigationMode,
  type NavigatorState,
} from './actions'

export type RootNavigatorParams = FlatNavigatorParams
export type RootNavigationProp = BaseNavigationProp<RootNavigatorParams>

/** Web screens share one flat stack; the route generic scopes param updates. */
export type NavigationProp<
  ParamList extends ParamListBase = FlatNavigatorParams,
  RouteName extends keyof ParamList & keyof FlatNavigatorParams =
    keyof ParamList & keyof FlatNavigatorParams,
> = NativeStackNavigationProp<FlatNavigatorParams, RouteName>

export function getTabNavigationAction(tab: SidebarTab, profileName = 'me') {
  if (tab === 'MyProfile') {
    return CommonActions.navigate('Profile', {name: profileName})
  }
  return CommonActions.navigate(tab)
}

export function getTabResetAction(tab: SidebarTab, profileName = 'me') {
  const route =
    tab === 'MyProfile'
      ? {name: 'Profile', params: {name: profileName}}
      : {name: tab}
  return CommonActions.reset({index: 0, routes: [route]})
}

export function getHomeNavigationAction(
  _state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  return mode === 'replace'
    ? StackActions.replace('Home')
    : CommonActions.navigate('Home')
}

export function getMessagesNavigationAction(
  params?: MessagesParams,
  _state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  return mode === 'replace'
    ? StackActions.replace('Messages', params)
    : CommonActions.navigate('Messages', params)
}

export function getCommonNavigationAction(
  destination: CommonNavigationDestination,
  _state?: NavigationState,
) {
  return CommonActions.navigate(destination)
}
