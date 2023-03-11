import {NavigationState, PartialState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

export type CommonNavigatorParams = {
  NotFound: undefined
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

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: undefined
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: undefined
  Notifications: undefined
}

export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  Home: undefined
  SearchTab: undefined
  Search: undefined
  NotificationsTab: undefined
  Notifications: undefined
}

// NOTE
// this isn't strictly correct but it should be close enough
// a TS wizard might be able to get this 100%
// -prf
export type NavigationProp = NativeStackNavigationProp<AllNavigatorParams>

export type State =
  | NavigationState
  | Omit<PartialState<NavigationState>, 'stale'>

export type RouteParams = Record<string, string>
export type MatchResult = {params: RouteParams}
export type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params: RouteParams) => string
}
