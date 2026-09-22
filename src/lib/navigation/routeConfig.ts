import {msg} from '@lingui/core/macro'

/** File routes and their existing screen identifiers for analytics and app links. */
export const routeConfig = {
  index: {name: 'Home', title: (_name = '') => msg`Home`, requireAuth: false},
  download: {
    name: 'Home',
    title: (_name = '') => msg`Home`,
    requireAuth: false,
  },
  search: {
    name: 'Search',
    title: (_name = '') => msg`Explore`,
    requireAuth: false,
  },
  feeds: {name: 'Feeds', title: (_name = '') => msg`Feeds`, requireAuth: false},
  notifications: {
    name: 'Notifications',
    title: (_name = '') => msg`Notifications`,
    requireAuth: true,
  },
  'notifications/activity': {
    name: 'NotificationsActivityList',
    title: (_name = '') => msg`Notifications`,
    requireAuth: true,
  },
  'notifications/settings': {
    name: 'LegacyNotificationSettings',
    title: (_name = '') => msg`Notification settings`,
    requireAuth: true,
  },
  settings: {
    name: 'Settings',
    title: (_name = '') => msg`Settings`,
    requireAuth: true,
  },
  lists: {name: 'Lists', title: (_name = '') => msg`Lists`, requireAuth: true},
  moderation: {
    name: 'Moderation',
    title: (_name = '') => msg`Moderation`,
    requireAuth: true,
  },
  'moderation/inbox': {
    name: 'ModerationInbox',
    title: (_name = '') => msg`Moderation inbox`,
    requireAuth: true,
  },
  'moderation/inbox/settings': {
    name: 'ModerationInboxSettings',
    title: (_name = '') => msg`Mod inbox settings`,
    requireAuth: true,
  },
  'moderation/inbox/report/details': {
    name: 'ModerationInboxReportDetails',
    title: (_name = '') => msg`Your report`,
    requireAuth: true,
  },
  'moderation/inbox/subject/details': {
    name: 'ModerationInboxSubjectDetails',
    title: (_name = '') => msg`Notice`,
    requireAuth: true,
  },
  'moderation/modlists': {
    name: 'ModerationModlists',
    title: (_name = '') => msg`Moderation Lists`,
    requireAuth: true,
  },
  'moderation/muted-accounts': {
    name: 'ModerationMutedAccounts',
    title: (_name = '') => msg`Muted Accounts`,
    requireAuth: true,
  },
  'moderation/blocked-accounts': {
    name: 'ModerationBlockedAccounts',
    title: (_name = '') => msg`Blocked Accounts`,
    requireAuth: true,
  },
  'moderation/interaction-settings': {
    name: 'ModerationInteractionSettings',
    title: (_name = '') => msg`Post Interaction Settings`,
    requireAuth: true,
  },
  'moderation/verification-settings': {
    name: 'ModerationVerificationSettings',
    title: (_name = '') => msg`Verification Settings`,
    requireAuth: true,
  },
  'profile/[name]/index': {
    name: 'Profile',
    title: (_name = '') => msg`Profile`,
    requireAuth: false,
  },
  'profile/[name]/rss': {
    name: 'Profile',
    title: (_name = '') => msg`Profile`,
    requireAuth: false,
  },
  'profile/[name]/followers': {
    name: 'ProfileFollowers',
    title: (name = '') => msg`People following @${name}`,
    requireAuth: false,
  },
  'profile/[name]/follows': {
    name: 'ProfileFollows',
    title: (name = '') => msg`People followed by @${name}`,
    requireAuth: false,
  },
  'profile/[name]/known-followers': {
    name: 'ProfileKnownFollowers',
    title: (name = '') => msg`Followers of @${name} that you know`,
    requireAuth: false,
  },
  'profile/[name]/search': {
    name: 'ProfileSearch',
    title: (name = '') => msg`Search @${name}'s posts`,
    requireAuth: false,
  },
  'profile/[name]/lists/[rkey]': {
    name: 'ProfileList',
    title: (_name = '') => msg`List`,
    requireAuth: true,
  },
  'profile/[name]/post/[rkey]': {
    name: 'PostThread',
    title: (name = '') => msg`Post by @${name}`,
    requireAuth: false,
  },
  'profile/[name]/post/[rkey]/liked-by': {
    name: 'PostLikedBy',
    title: (name = '') => msg`Post by @${name}`,
    requireAuth: false,
  },
  'profile/[name]/post/[rkey]/reposted-by': {
    name: 'PostRepostedBy',
    title: (name = '') => msg`Post by @${name}`,
    requireAuth: false,
  },
  'profile/[name]/post/[rkey]/quotes': {
    name: 'PostQuotes',
    title: (name = '') => msg`Post by @${name}`,
    requireAuth: false,
  },
  'profile/[name]/feed/[rkey]': {
    name: 'CustomFeed',
    title: (_name = '') => msg`Feed`,
    requireAuth: false,
  },
  'profile/[name]/feed/[rkey]/liked-by': {
    name: 'CustomFeedLikedBy',
    title: (_name = '') => msg`Liked by`,
    requireAuth: false,
  },
  'profile/[name]/labeler/liked-by': {
    name: 'ProfileLabelerLikedBy',
    title: (_name = '') => msg`Liked by`,
    requireAuth: false,
  },
  'sys/debug': {
    name: 'Debug',
    title: (_name = '') => msg`Storybook`,
    requireAuth: true,
  },
  'sys/debug-mod': {
    name: 'DebugMod',
    title: (_name = '') => msg`Moderation states`,
    requireAuth: true,
  },
  'sys/log': {name: 'Log', title: (_name = '') => msg`Log`, requireAuth: true},
  'invite/scan': {
    name: 'InviteScanner',
    title: (_name = '') => msg`Scan QR code`,
    requireAuth: true,
  },
  'settings/language': {
    name: 'LanguageSettings',
    title: (_name = '') => msg`Language Settings`,
    requireAuth: true,
  },
  'settings/app-passwords': {
    name: 'AppPasswords',
    title: (_name = '') => msg`App Passwords`,
    requireAuth: true,
  },
  'settings/following-feed': {
    name: 'PreferencesFollowingFeed',
    title: (_name = '') => msg`Following Feed Preferences`,
    requireAuth: true,
  },
  'settings/threads': {
    name: 'PreferencesThreads',
    title: (_name = '') => msg`Threads Preferences`,
    requireAuth: true,
  },
  'settings/external-embeds': {
    name: 'PreferencesExternalEmbeds',
    title: (_name = '') => msg`External Media Preferences`,
    requireAuth: true,
  },
  'settings/accessibility': {
    name: 'AccessibilitySettings',
    title: (_name = '') => msg`Accessibility Settings`,
    requireAuth: true,
  },
  'settings/appearance': {
    name: 'AppearanceSettings',
    title: (_name = '') => msg`Appearance`,
    requireAuth: true,
  },
  'settings/beta-features': {
    name: 'BetaFeaturesSettings',
    title: (_name = '') => msg`Beta features`,
    requireAuth: true,
  },
  'settings/saved-feeds': {
    name: 'SavedFeeds',
    title: (_name = '') => msg`Edit My Feeds`,
    requireAuth: true,
  },
  'settings/account': {
    name: 'AccountSettings',
    title: (_name = '') => msg`Account`,
    requireAuth: true,
  },
  'settings/automation-label': {
    name: 'AutomationLabelSettings',
    title: (_name = '') => msg`Automation Label`,
    requireAuth: true,
  },
  'settings/privacy-and-security': {
    name: 'PrivacyAndSecuritySettings',
    title: (_name = '') => msg`Privacy and Security`,
    requireAuth: true,
  },
  'settings/privacy-and-security/activity': {
    name: 'ActivityPrivacySettings',
    title: (_name = '') => msg`Privacy and Security`,
    requireAuth: true,
  },
  'settings/content-and-media': {
    name: 'ContentAndMediaSettings',
    title: (_name = '') => msg`Content and Media`,
    requireAuth: true,
  },
  'settings/interests': {
    name: 'InterestsSettings',
    title: (_name = '') => msg`Your interests`,
    requireAuth: true,
  },
  'settings/about': {
    name: 'AboutSettings',
    title: (_name = '') => msg`About`,
    requireAuth: true,
  },
  'settings/app-icon': {
    name: 'AppIconSettings',
    title: (_name = '') => msg`App Icon`,
    requireAuth: true,
  },
  'settings/notifications': {
    name: 'NotificationSettings',
    title: (_name = '') => msg`Notification settings`,
    requireAuth: true,
  },
  'settings/notifications/activity': {
    name: 'ActivityNotificationSettings',
    title: (_name = '') => msg`Activity notifications`,
    requireAuth: true,
  },
  'settings/find-contacts': {
    name: 'FindContactsSettings',
    title: (_name = '') => msg`Find Contacts`,
    requireAuth: true,
  },
  support: {
    name: 'Support',
    title: (_name = '') => msg`Support`,
    requireAuth: false,
  },
  'support/privacy': {
    name: 'PrivacyPolicy',
    title: (_name = '') => msg`Privacy Policy`,
    requireAuth: false,
  },
  'support/tos': {
    name: 'TermsOfService',
    title: (_name = '') => msg`Terms of Service`,
    requireAuth: false,
  },
  'support/community-guidelines': {
    name: 'CommunityGuidelines',
    title: (_name = '') => msg`Community Guidelines`,
    requireAuth: false,
  },
  'support/copyright': {
    name: 'CopyrightPolicy',
    title: (_name = '') => msg`Copyright Policy`,
    requireAuth: false,
  },
  'hashtag/[tag]': {
    name: 'Hashtag',
    title: (_name = '') => msg`Hashtag`,
    requireAuth: false,
  },
  'topic/[topic]': {
    name: 'Topic',
    title: (_name = '') => msg`Topic`,
    requireAuth: false,
  },
  messages: {
    name: 'Messages',
    title: (_name = '') => msg`Messages`,
    requireAuth: true,
  },
  'messages/settings': {
    name: 'MessagesSettings',
    title: (_name = '') => msg`Chat settings`,
    requireAuth: true,
  },
  'messages/inbox': {
    name: 'MessagesInbox',
    title: (_name = '') => msg`Chat request inbox`,
    requireAuth: true,
  },
  'messages/[conversation]': {
    name: 'MessagesConversation',
    title: (_name = '') => msg`Chat`,
    requireAuth: true,
  },
  'messages/[conversation]/settings': {
    name: 'MessagesConversationSettings',
    title: (_name = '') => msg`Group chat settings`,
    requireAuth: true,
  },
  'messages/[conversation]/requests': {
    name: 'MessagesJoinRequests',
    title: (_name = '') => msg`Requests to join`,
    requireAuth: true,
  },
  'start/[name]/[rkey]': {
    name: 'Start',
    title: (_name = '') => msg`Home`,
    requireAuth: false,
  },
  'starter-pack/edit/[rkey]': {
    name: 'StarterPackEdit',
    title: (_name = '') => msg`Edit your Starter Pack`,
    requireAuth: true,
  },
  'starter-pack/[name]/[rkey]': {
    name: 'StarterPack',
    title: (_name = '') => msg`Starter Pack`,
    requireAuth: false,
  },
  'starter-pack-short/[code]': {
    name: 'StarterPackShort',
    title: (_name = '') => msg`Starter Pack`,
    requireAuth: false,
  },
  'starter-pack/create': {
    name: 'StarterPackWizard',
    title: (_name = '') => msg`Create a Starter Pack`,
    requireAuth: true,
  },
  'video-feed': {
    name: 'VideoFeed',
    title: (_name = '') => msg`Video Feed`,
    requireAuth: true,
  },
  saved: {
    name: 'Bookmarks',
    title: (_name = '') => msg`Saved Posts`,
    requireAuth: true,
  },
  'find-contacts': {
    name: 'FindContactsFlow',
    title: (_name = '') => msg`Find Contacts`,
    requireAuth: true,
    gestureEnabled: false,
  },
  'sys/shared-preferences': {
    name: 'SharedPreferencesTester',
    title: (_name = '') => msg`Shared Preferences Tester`,
    requireAuth: false,
  },
  'my-profile': {
    name: 'MyProfile',
    title: (_name = '') => msg`Profile`,
    requireAuth: true,
  },
  '+not-found': {
    name: 'NotFound',
    title: (_name = '') => msg`Not Found`,
    requireAuth: false,
  },
  'intent/[...intent]': {
    name: 'Home',
    title: (_name = '') => msg`Home`,
    requireAuth: false,
  },
  'chat/[code]': {
    name: 'Home',
    title: (_name = '') => msg`Home`,
    requireAuth: false,
  },
} as const
