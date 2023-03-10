import {NavigationState, PartialState} from '@react-navigation/native'

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
export type HomeStackNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}
export type NotificationsStackNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}
export type SearchStackNavigatorParams = CommonNavigatorParams & {
  Search: undefined
}
export type State =
  | NavigationState
  | Omit<PartialState<NavigationState>, 'stale'>
