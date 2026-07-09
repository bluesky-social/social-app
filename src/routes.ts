import {Router} from '#/lib/routes/router'
import {type FlatNavigatorParams} from './lib/routes/types'

type AllNavigatableRoutes = Omit<
  FlatNavigatorParams,
  'NotFound' | 'SharedPreferencesTester' | 'Ios26CrashRegression'
>

export const router = new Router<AllNavigatableRoutes>({
  Home: ['/', '/download'],
  AuthCallback: '/auth/web/callback',
  Search: '/search',
  Feeds: '/feeds',
  Notifications: '/notifications',
  NotificationsActivityList: '/notifications/activity',
  LegacyNotificationSettings: '/notifications/settings',
  Settings: '/settings',
  Lists: '/lists',
  // moderation
  Moderation: '/moderation',
  ModerationModlists: '/moderation/modlists',
  ModerationMutedAccounts: '/moderation/muted-accounts',
  ModerationBlockedAccounts: '/moderation/blocked-accounts',
  ModerationInteractionSettings: '/moderation/interaction-settings',
  ModerationVerificationSettings: '/moderation/verification-settings',
  // profiles, threads, lists
  Profile: ['/profile/:name', '/profile/:name/rss'],
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  ProfileKnownFollowers: '/profile/:name/known-followers',
  ProfileSearch: '/profile/:name/search',
  ProfileList: '/profile/:name/lists/:rkey',
  PostThread: '/profile/:name/post/:rkey',
  PostLikedBy: '/profile/:name/post/:rkey/liked-by',
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
  PostQuotes: '/profile/:name/post/:rkey/quotes',
  ProfileFeed: '/profile/:name/feed/:rkey',
  ProfileFeedLikedBy: '/profile/:name/feed/:rkey/liked-by',
  ProfileLabelerLikedBy: '/profile/:name/labeler/liked-by',
  // debug
  Debug: '/sys/debug',
  DebugMod: '/sys/debug-mod',
  Log: '/sys/log',
  // invite friends
  InviteScanner: '/invite/scan',
  // settings
  LanguageSettings: '/settings/language',
  AppPasswords: '/settings/app-passwords',
  PreferencesFollowingFeed: '/settings/following-feed',
  PreferencesThreads: '/settings/threads',
  PreferencesExternalEmbeds: '/settings/external-embeds',
  AccessibilitySettings: '/settings/accessibility',
  AIPreferencesSettings: '/settings/ai-preferences',
  AppearanceSettings: '/settings/appearance',
  SavedFeeds: '/settings/saved-feeds',
  AccountSettings: '/settings/account',
  AutomationLabelSettings: '/settings/automation-label',
  PrivacyAndSecuritySettings: '/settings/privacy-and-security',
  ActivityPrivacySettings: '/settings/privacy-and-security/activity',
  ContentAndMediaSettings: '/settings/content-and-media',
  InterestsSettings: '/settings/interests',
  AboutSettings: '/settings/about',
  AppIconSettings: '/settings/app-icon',
  NotificationSettings: '/settings/notifications',
  FindContactsSettings: '/settings/find-contacts',
  // support
  Support: '/support',
  SupportReturn: '/return',
  PrivacyPolicy: '/support/privacy',
  TermsOfService: '/support/tos',
  CommunityGuidelines: '/support/community-guidelines',
  CopyrightPolicy: '/support/copyright',
  // hashtags
  Hashtag: '/hashtag/:tag',
  Topic: '/topic/:topic',
  // DMs
  Messages: '/messages',
  MessagesSettings: '/messages/settings',
  MessagesInbox: '/messages/inbox',
  MessagesConversation: '/messages/:conversation',
  MessagesConversationSettings: '/messages/:conversation/settings',
  MessagesJoinRequests: '/messages/:conversation/requests',
  // starter packs
  Start: '/start/:name/:rkey',
  StarterPackEdit: '/starter-pack/edit/:rkey',
  StarterPack: '/starter-pack/:name/:rkey',
  StarterPackShort: '/starter-pack-short/:code',
  StarterPackWizard: '/starter-pack/create',
  VideoFeed: '/video-feed',
  Bookmarks: '/saved',
  FindContactsFlow: '/find-contacts',
})
