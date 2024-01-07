import {NavigationState, PartialState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

export type CommonNavigatorParams = {
  NotFound: undefined
  Lists: undefined
  Moderation: undefined
  ModerationModlists: undefined
  ModerationMutedAccounts: undefined
  ModerationBlockedAccounts: undefined
  Settings: undefined
  LanguageSettings: undefined
  Profile: {name: string; hideBackButton?: boolean}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  ProfileList: {name: string; rkey: string}
  PostThread: {name: string; rkey: string}
  PostLikedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  ProfileFeed: {name: string; rkey: string}
  ProfileFeedLikedBy: {name: string; rkey: string}
  Debug: undefined
  Log: undefined
  Support: undefined
  PrivacyPolicy: undefined
  TermsOfService: undefined
  CommunityGuidelines: undefined
  CopyrightPolicy: undefined
  AppPasswords: undefined
  SavedFeeds: undefined
  PreferencesHomeFeed: undefined
  PreferencesThreads: undefined
  PreferencesExternalEmbeds: undefined
}

export type BottomTabNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  SearchTab: undefined
  FeedsTab: undefined
  NotificationsTab: undefined
  MyProfileTab: undefined
}

export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: {q?: string}
}

export type FeedsTabNavigatorParams = CommonNavigatorParams & {
  Feeds: undefined
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}

export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: undefined
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: {q?: string}
  Feeds: undefined
  Notifications: undefined
}

export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  Home: undefined
  SearchTab: undefined
  Search: {q?: string}
  FeedsTab: undefined
  Feeds: undefined
  NotificationsTab: undefined
  Notifications: undefined
  MyProfileTab: undefined
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
