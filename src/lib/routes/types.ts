import {type NavigationState, type PartialState} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

export type CommonNavigatorParams = {
  NotFound: undefined
  Lists: undefined
  Moderation: undefined
  ModerationModlists: undefined
  ModerationMutedAccounts: undefined
  ModerationBlockedAccounts: undefined
  ModerationInteractionSettings: undefined
  ModerationVerificationSettings: undefined
  Settings: undefined
  Profile: {name: string; hideBackButton?: boolean}
  ProfileFollowers: {name: string}
  ProfileFollows: {name: string}
  ProfileKnownFollowers: {name: string}
  ProfileSearch: {name: string; q?: string}
  ProfileList: {name: string; rkey: string}
  PostThread: {name: string; rkey: string}
  PostLikedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  PostQuotes: {name: string; rkey: string}
  ProfileFeed: {
    name: string
    rkey: string
    feedCacheKey?: 'discover' | 'explore' | undefined
  }
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
  ActivityPrivacySettings: undefined
  ContentAndMediaSettings: undefined
  NotificationSettings: undefined
  ReplyNotificationSettings: undefined
  MentionNotificationSettings: undefined
  QuoteNotificationSettings: undefined
  LikeNotificationSettings: undefined
  RepostNotificationSettings: undefined
  NewFollowerNotificationSettings: undefined
  LikesOnRepostsNotificationSettings: undefined
  RepostsOnRepostsNotificationSettings: undefined
  ActivityNotificationSettings: undefined
  MiscellaneousNotificationSettings: undefined
  InterestsSettings: undefined
  AboutSettings: undefined
  AppIconSettings: undefined
  Search: {q?: string}
  Hashtag: {tag: string; author?: string}
  Topic: {topic: string}
  MessagesConversation: {conversation: string; embed?: string; accept?: true}
  MessagesSettings: undefined
  MessagesInbox: undefined
  NotificationsActivityList: {posts: string}
  LegacyNotificationSettings: undefined
  Feeds: undefined
  Start: {name: string; rkey: string}
  StarterPack: {name: string; rkey: string; new?: boolean}
  StarterPackShort: {code: string}
  StarterPackWizard: {
    fromDialog?: boolean
    targetDid?: string
    onSuccess?: () => void
  }
  StarterPackEdit: {rkey?: string}
  VideoFeed: VideoFeedSourceContext
  Bookmarks: undefined
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
  Notifications: undefined
}

export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: {name: 'me'; hideBackButton: true}
}

export type MessagesTabNavigatorParams = CommonNavigatorParams & {
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'}
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: {q?: string}
  Feeds: undefined
  Notifications: undefined
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'}
}

export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined
  Home: undefined
  SearchTab: undefined
  Search: {q?: string}
  Feeds: undefined
  NotificationsTab: undefined
  Notifications: undefined
  MyProfileTab: undefined
  MessagesTab: undefined
  Messages: {animation?: 'push' | 'pop'}
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
  build: (params?: Record<string, any>) => string
}
