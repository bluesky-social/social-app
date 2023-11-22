import {Router} from 'lib/routes/router'

export enum RouteName {
  Home = 'Home',
  Search = 'Search',
  Feeds = 'Feeds',
  Notifications = 'Notifications',
  Settings = 'Settings',
  LanguageSettings = 'LanguageSettings',
  Lists = 'Lists',
  Moderation = 'Moderation',
  ModerationModlists = 'ModerationModlists',
  ModerationMutedAccounts = 'ModerationMutedAccounts',
  ModerationBlockedAccounts = 'ModerationBlockedAccounts',
  Profile = 'Profile',
  ProfileFollowers = 'ProfileFollowers',
  ProfileFollows = 'ProfileFollows',
  ProfileList = 'ProfileList',
  PostThread = 'PostThread',
  PostLikedBy = 'PostLikedBy',
  PostRepostedBy = 'PostRepostedBy',
  ProfileFeed = 'ProfileFeed',
  ProfileFeedLikedBy = 'ProfileFeedLikedBy',
  Debug = 'Debug',
  Log = 'Log',
  AppPasswords = 'AppPasswords',
  PreferencesHomeFeed = 'PreferencesHomeFeed',
  PreferencesThreads = 'PreferencesThreads',
  SavedFeeds = 'SavedFeeds',
  Support = 'Support',
  PrivacyPolicy = 'PrivacyPolicy',
  TermsOfService = 'TermsOfService',
  CommunityGuidelines = 'CommunityGuidelines',
  CopyrightPolicy = 'CopyrightPolicy',
}

export const routes: {
  [key in RouteName]: string
} = {
  Home: '/',
  Search: '/search',
  Feeds: '/feeds',
  Notifications: '/notifications',
  Settings: '/settings',
  LanguageSettings: '/settings/language',
  Lists: '/lists',
  Moderation: '/moderation',
  ModerationModlists: '/moderation/modlists',
  ModerationMutedAccounts: '/moderation/muted-accounts',
  ModerationBlockedAccounts: '/moderation/blocked-accounts',
  Profile: '/profile/:name',
  ProfileFollowers: '/profile/:name/followers',
  ProfileFollows: '/profile/:name/follows',
  ProfileList: '/profile/:name/lists/:rkey',
  PostThread: '/profile/:name/post/:rkey',
  PostLikedBy: '/profile/:name/post/:rkey/liked-by',
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by',
  ProfileFeed: '/profile/:name/feed/:rkey',
  ProfileFeedLikedBy: '/profile/:name/feed/:rkey/liked-by',
  Debug: '/sys/debug',
  Log: '/sys/log',
  AppPasswords: '/settings/app-passwords',
  PreferencesHomeFeed: '/settings/home-feed',
  PreferencesThreads: '/settings/threads',
  SavedFeeds: '/settings/saved-feeds',
  Support: '/support',
  PrivacyPolicy: '/support/privacy',
  TermsOfService: '/support/tos',
  CommunityGuidelines: '/support/community-guidelines',
  CopyrightPolicy: '/support/copyright',
}

export const router = new Router(routes)

export const ROUTES_CONFIG: {
  [key in RouteName]:
    | {
        isPublic: boolean
      }
    | undefined
} = {
  Home: {
    isPublic: true,
  },
  Search: {
    isPublic: true,
  },
  Feeds: {
    isPublic: true,
  },
  Notifications: {
    isPublic: false,
  },
  Settings: {
    isPublic: false,
  },
  LanguageSettings: {
    isPublic: false,
  },
  Lists: {
    isPublic: false,
  },
  Moderation: {
    isPublic: false,
  },
  ModerationModlists: {
    isPublic: false,
  },
  ModerationMutedAccounts: {
    isPublic: false,
  },
  ModerationBlockedAccounts: {
    isPublic: false,
  },
  Profile: {
    isPublic: true,
  },
  ProfileFollowers: {
    isPublic: true,
  },
  ProfileFollows: {
    isPublic: true,
  },
  ProfileList: {
    isPublic: false,
  },
  PostThread: {
    isPublic: true,
  },
  PostLikedBy: {
    isPublic: true,
  },
  PostRepostedBy: {
    isPublic: true,
  },
  ProfileFeed: {
    isPublic: true,
  },
  ProfileFeedLikedBy: {
    isPublic: true,
  },
  Debug: {
    isPublic: false,
  },
  Log: {
    isPublic: false,
  },
  AppPasswords: {
    isPublic: false,
  },
  PreferencesHomeFeed: {
    isPublic: false,
  },
  PreferencesThreads: {
    isPublic: false,
  },
  SavedFeeds: {
    isPublic: false,
  },
  Support: {
    isPublic: true,
  },
  PrivacyPolicy: {
    isPublic: true,
  },
  TermsOfService: {
    isPublic: true,
  },
  CommunityGuidelines: {
    isPublic: true,
  },
  CopyrightPolicy: {
    isPublic: true,
  },
}
