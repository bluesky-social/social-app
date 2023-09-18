import {Router} from 'lib/routes/router'

export const router = new Router({
  Home: '/',
  Search: '/search',
  Feeds: '/feeds',
  Notifications: '/notifications',
  Settings: '/settings',
  LanguageSettings: '/settings/language',
  Moderation: '/moderation',
  ModerationMuteLists: '/moderation/mute-lists',
  ModerationMutedAccounts: '/moderation/muted-accounts',
  ModerationBlockedAccounts: '/moderation/blocked-accounts',
  Profile: '/profile/:name',
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  ProfileList: '/profile/:name/lists/:rkey',
  PostThread: '/profile/:name/post/:rkey',
  PostLikedBy: '/profile/:name/post/:rkey/liked-by',
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
  CustomFeed: '/profile/:name/feed/:rkey',
  CustomFeedLikedBy: '/profile/:name/feed/:rkey/liked-by',
  Debug: '/sys/debug',
  Log: '/sys/log',
  AppPasswords: '/settings/app-passwords',
  PreferencesHomeFeed: '/settings/home-feed',
  SavedFeeds: '/settings/saved-feeds',
  Support: '/support',
  PrivacyPolicy: '/support/privacy',
  TermsOfService: '/support/tos',
  CommunityGuidelines: '/support/community-guidelines',
  CopyrightPolicy: '/support/copyright',
})
