import {Router} from '#/lib/routes/router'

export const router = new Router({
  Home: '/',
  Search: '/search',
  Feeds: '/feeds',
  Notifications: '/notifications',
  NotificationSettings: '/notifications/settings',
  Settings: '/settings',
  Lists: '/lists',
  // moderation
  Moderation: '/moderation',
  ModerationModlists: '/moderation/modlists',
  ModerationMutedAccounts: '/moderation/muted-accounts',
  ModerationBlockedAccounts: '/moderation/blocked-accounts',
  // profiles, threads, lists
  Profile: ['/profile/:name', '/profile/:name/rss'],
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  ProfileKnownFollowers: '/profile/:name/known-followers',
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
  // settings
  LanguageSettings: '/settings/language',
  AppPasswords: '/settings/app-passwords',
  PreferencesFollowingFeed: '/settings/following-feed',
  PreferencesThreads: '/settings/threads',
  PreferencesExternalEmbeds: '/settings/external-embeds',
  AccessibilitySettings: '/settings/accessibility',
  AppearanceSettings: '/settings/appearance',
  SavedFeeds: '/settings/saved-feeds',
  // new settings
  AccountSettings: '/settings/account',
  PrivacyAndSecuritySettings: '/settings/privacy-and-security',
  ContentAndMediaSettings: '/settings/content-and-media',
  AboutSettings: '/settings/about',
  AppIconSettings: '/settings/app-icon',
  // support
  Support: '/support',
  PrivacyPolicy: '/support/privacy',
  TermsOfService: '/support/tos',
  CommunityGuidelines: '/support/community-guidelines',
  CopyrightPolicy: '/support/copyright',
  // hashtags
  Hashtag: '/hashtag/:tag',
  // DMs
  Messages: '/messages',
  MessagesSettings: '/messages/settings',
  MessagesConversation: '/messages/:conversation',
  // starter packs
  Start: '/start/:name/:rkey',
  StarterPackEdit: '/starter-pack/edit/:rkey',
  StarterPack: '/starter-pack/:name/:rkey',
  StarterPackShort: '/starter-pack-short/:code',
  StarterPackWizard: '/starter-pack/create',
})
