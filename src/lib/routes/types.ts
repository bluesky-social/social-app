import {
  type CompositeNavigationProp,
  type NavigationProp as BaseNavigationProp,
  type NavigationState,
  type NavigatorScreenParams,
  type ParamListBase,
  type PartialState,
} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type SearchFilters} from '#/screens/Search/searchParams'
import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'

export type {NativeStackScreenProps} from '@react-navigation/native-stack'

/**
 * The advanced-search filter params are owned by searchParams.ts (the param
 * model, serialization, and helpers all live there). Re-export the type so the
 * route params stay in sync with it automatically rather than being a second
 * hand-maintained copy.
 */
export type SearchFilterParams = SearchFilters

export type SearchParams = {
  q?: string
  tab?: 'user' | 'profile' | 'feed' | 'latest'
} & SearchFilterParams

export type ModerationInboxTab = 'reports' | 'account'

export type CommonNavigatorParams = {
  NotFound: undefined
  Atmosphere: undefined
  Lists: undefined
  Moderation: undefined
  ModerationInbox: {tab?: ModerationInboxTab}
  ModerationInboxSettings: undefined
  ModerationInboxReportDetails: {moderationService: string; id: string}
  ModerationInboxNoticeDetails: {moderationService: string; subject: string}
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
  ProfileSearch: {name: string} & SearchParams
  ProfileList: {name: string; rkey: string}
  PostThread: {name: string; rkey: string}
  PostLikedBy: {name: string; rkey: string}
  PostRepostedBy: {name: string; rkey: string}
  PostQuotes: {name: string; rkey: string}
  CustomFeed: {
    name: string
    rkey: string
    feedCacheKey?: 'discover' | 'explore' | undefined
  }
  CustomFeedLikedBy: {name: string; rkey: string}
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
  BetaFeaturesSettings: undefined
  AccountSettings: undefined
  AutomationLabelSettings: undefined
  PrivacyAndSecuritySettings: undefined
  ActivityPrivacySettings: undefined
  ContentAndMediaSettings: undefined
  NotificationSettings: undefined
  ActivityNotificationSettings: undefined
  InterestsSettings: undefined
  AboutSettings: undefined
  AppIconSettings: undefined
  FindContactsSettings: undefined
  InviteScanner: undefined
  Search: SearchParams
  Hashtag: {tag: string; author?: string}
  Topic: {topic: string}
  MessagesConversation: {conversation: string; embed?: string; accept?: true}
  MessagesConversationSettings: {conversation: string}
  MessagesJoinRequests: {conversation: string}
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
  FindContactsFlow: undefined
}

export type BottomTabNavigatorParams = {
  HomeTab: NavigatorScreenParams<HomeTabNavigatorParams> | undefined
  SearchTab: NavigatorScreenParams<SearchTabNavigatorParams> | undefined
  NotificationsTab:
    NavigatorScreenParams<NotificationsTabNavigatorParams> | undefined
  MyProfileTab: NavigatorScreenParams<MyProfileTabNavigatorParams> | undefined
  MessagesTab: NavigatorScreenParams<MessagesTabNavigatorParams> | undefined
  AtmosphereTab: NavigatorScreenParams<CommonNavigatorParams> | undefined
  FeedsTab: NavigatorScreenParams<CommonNavigatorParams> | undefined
  ListsTab: NavigatorScreenParams<CommonNavigatorParams> | undefined
  BookmarksTab: NavigatorScreenParams<CommonNavigatorParams> | undefined
  SettingsTab: NavigatorScreenParams<CommonNavigatorParams> | undefined
}

export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined
}

export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: SearchParams
}

export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined
}

export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: {name: 'me'; hideBackButton: true}
}

export type MessagesTabNavigatorParams = CommonNavigatorParams & {
  Messages:
    | {
        pushToConversation?: string
        pushToNewGroupChat?: boolean
        animation?: 'push' | 'pop'
      }
    | undefined
}

export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined
  Search: SearchParams
  Feeds: undefined
  Notifications: undefined
  Messages: {
    pushToConversation?: string
    pushToNewGroupChat?: boolean
    animation?: 'push' | 'pop'
  }
}

export type AllNavigatorParams = FlatNavigatorParams & BottomTabNavigatorParams

/** Shared root navigation without assuming a native tab or web stack router. */
export type RootNavigationProp = BaseNavigationProp<AllNavigatorParams>

/**
 * Stack navigation with access to native parent tab destinations. Only the
 * parent's common navigation methods are included because shared callers also
 * run on web, where there is no tab navigator.
 *
 * Pass the current stack and route to scope stack helpers and param updates.
 * The default retains all web leaf routes for shared callers whose native
 * stack is not known, but excludes tab routes from stack helpers.
 */
export type NavigationProp<
  ParamList extends ParamListBase = FlatNavigatorParams,
  RouteName extends keyof ParamList & string = keyof ParamList & string,
> = CompositeNavigationProp<
  NativeStackNavigationProp<ParamList, RouteName>,
  BaseNavigationProp<BottomTabNavigatorParams>
>

export type State =
  NavigationState | Omit<PartialState<NavigationState>, 'stale'>

export type RouteParams = Record<string, string>
export type MatchResult = {params: RouteParams}
export type Route = {
  match: (path: string) => MatchResult | undefined
  build: (params?: Record<string, unknown>) => string
}
