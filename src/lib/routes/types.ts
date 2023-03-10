import {NavigationState, PartialState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

export type CommonNavigatorParams = {
  Settings: undefined
  Profile: {name: string}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  PostThread: {name: string; rkey: string}
  PostUpvotedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  Debug: undefined
  Log: undefined
}

export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: undefined
}

// NOTE
// this isn't strictly correct but it should be close enough
// a TS wizard might be able to get this 100%
// -prf
export type NavigationProp = NativeStackNavigationProp<
  CommonNavigatorParams & {
    HomeTab: undefined
    NotificationsTab: undefined
    SearchTab: undefined
  }
>

export type State =
  | NavigationState
  | Omit<PartialState<NavigationState>, 'stale'>
