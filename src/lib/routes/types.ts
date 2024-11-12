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
  Profile: {name: string; hideBackButton?: boolean}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  ProfileKnownFollowers: {name: string}
  ProfileList: {name: string; rkey: string}
  PostThread: {name: string; rkey: string}
  PostLikedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  PostQuotes: {name: string; rkey: string}
  ProfileFeed: {name: string; rkey: string}
  ProfileFeedLikedBy: {name: string; rkey: string}
  ProfileLabelerLikedBy: {name: string}
  Debug: undefined
  DebugMod: undefined
  SharedPreferencesTester: undefined
  Log: undefined
  Support: undefined
  PrivacyPolicy: undefined
  TermsOfService: undefined
  CommunityGuidelines: undefined
  CopyrightPolicy: undefined
  LanguageSettings: undefined
  AppPasswords: undefined
  SavedFeeds: undefined
  PreferencesFollowingFeed: undefined
  PreferencesThreads: undefined
  PreferencesExternalEmbeds: undefined
  AccessibilitySettings: undefined
  AppearanceSettings: undefined
  AccountSettings: undefined
  PrivacyAndSecuritySettings: undefined
  ContentAndMediaSettings: undefined
  AboutSettings: undefined
  Search: {q?: string}
  Hashtag: {tag: string; author?: string}
  MessagesConversation: {conversation: string; embed?: string}
  MessagesSettings: undefined
  NotificationSettings: undefined
  Feeds: undefined
  Start: {name: string; rkey: string}
  StarterPack: {name: string; rkey: string; new?: boolean}
  StarterPackShort: {code: string}
  StarterPackWizard: undefined
  StarterPackEdit: {rkey?: string}
}

export type BottomTabNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  SearchTab: undefined
  NotificationsTab: undefined
  MyProfileTab: undefined
  MessagesTab: undefined
}

export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: {q?: string}
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: {show?: 'all'}
}

export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: undefined
}

export type MessagesTabNavigatorParams = CommonNavigatorParams & {
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'}
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: {q?: string}
  Feeds: undefined
  Notifications: {show?: 'all'}
  Hashtag: {tag: string; author?: string}
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'}
}

export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  Home: undefined
  SearchTab: undefined
  Search: {q?: string}
  Feeds: undefined
  NotificationsTab: undefined
  Notifications: {show?: 'all'}
  MyProfileTab: undefined
  Hashtag: {tag: string; author?: string}
  MessagesTab: undefined
  Messages: {animation?: 'push' | 'pop'}
  Start: {name: string; rkey: string}
  StarterPack: {name: string; rkey: string; new?: boolean}
  StarterPackShort: {code: string}
  StarterPackWizard: undefined
  StarterPackEdit: {rkey?: string}
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
