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

  // profiles, threads, lists
  Profile: ['/:name', '/:name/rss', '/profile/:name', '/profile/:name/rss'],
  ProfileFollowers: ['/:name/followers', '/profile/:name/followers'],
  ProfileFollows: ['/:name/follows', '/profile/:name/follows'],
  ProfileKnownFollowers: [
    '/:name/known-followers',
    '/profile/:name/known-followers',
  ],
  ProfileList: ['/:name/lists/:rkey', '/profile/:name/lists/:rkey'],
  PostThread: ['/:name/post/:rkey', '/profile/:name/post/:rkey'],
  PostLikedBy: [
    '/:name/post/:rkey/liked-by',
    '/profile/:name/post/:rkey/liked-by',
  ],
  PostRepostedBy: [
    '/:name/post/:rkey/reposted-by',
    '/profile/:name/post/:rkey/reposted-by',
  ],
  PostQuotes: ['/:name/post/:rkey/quotes', '/profile/:name/post/:rkey/quotes'],
  ProfileFeed: ['/:name/feed/:rkey', '/profile/:name/feed/:rkey'],
  ProfileFeedLikedBy: [
    '/:name/feed/:rkey/liked-by',
    '/profile/:name/feed/:rkey/liked-by',
  ],
  ProfileLabelerLikedBy: [
    '/:name/labeler/liked-by',
    '/profile/:name/labeler/liked-by',
  ],
})
