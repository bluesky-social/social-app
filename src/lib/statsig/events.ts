export type LogEvents = {
  // App events
  init: {
    initMs: number
  }
  'account:loggedIn': {
    logContext:
      | 'LoginForm'
      | 'SwitchAccount'
      | 'ChooseAccountForm'
      | 'Settings'
      | 'Notification'
    withPassword: boolean
  }
  'account:loggedOut': {
    logContext: 'SwitchAccount' | 'Settings' | 'SignupQueued' | 'Deactivated'
  }
  'notifications:openApp': {}
  'notifications:request': {
    context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home'
    status: 'granted' | 'denied' | 'undetermined'
  }
  'state:background:sampled': {
    secondsActive: number
  }
  'state:foreground:sampled': {}
  'router:navigate:sampled': {}

  // Screen events
  'splash:signInPressed': {}
  'splash:createAccountPressed': {}
  'signup:nextPressed': {
    activeStep: number
  }
  'onboarding:interests:nextPressed': {
    selectedInterests: string[]
    selectedInterestsLength: number
  }
  'onboarding:suggestedAccounts:nextPressed': {
    selectedAccountsLength: number
    skipped: boolean
  }
  'onboarding:followingFeed:nextPressed': {}
  'onboarding:algoFeeds:nextPressed': {
    selectedPrimaryFeeds: string[]
    selectedPrimaryFeedsLength: number
    selectedSecondaryFeeds: string[]
    selectedSecondaryFeedsLength: number
  }
  'onboarding:topicalFeeds:nextPressed': {
    selectedFeeds: string[]
    selectedFeedsLength: number
  }
  'onboarding:moderation:nextPressed': {}
  'onboarding:profile:nextPressed': {}
  'onboarding:finished:nextPressed': {}
  'onboarding:finished:avatarResult': {
    avatarResult: 'default' | 'created' | 'uploaded'
  }
  'home:feedDisplayed:sampled': {
    feedUrl: string
    feedType: string
    index: number
    reason: 'focus' | 'tabbar-click' | 'pager-swipe' | 'desktop-sidebar-click'
  }
  'feed:endReached:sampled': {
    feedUrl: string
    feedType: string
    itemCount: number
  }
  'feed:refresh:sampled': {
    feedUrl: string
    feedType: string
    reason: 'pull-to-refresh' | 'soft-reset' | 'load-latest'
  }
  'composer:gif:open': {}
  'composer:gif:select': {}

  // Data events
  'account:create:begin': {}
  'account:create:success': {}
  'post:create': {
    imageCount: number
    isReply: boolean
    hasLink: boolean
    hasQuote: boolean
    langs: string
    logContext: 'Composer'
  }
  'post:like': {
    doesLikerFollowPoster: boolean | undefined
    doesPosterFollowLiker: boolean | undefined
    likerClout: number | undefined
    postClout: number | undefined
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:repost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unlike': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unrepost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:mute': {}
  'post:unmute': {}
  'profile:follow': {
    didBecomeMutual: boolean | undefined
    followeeClout: number | undefined
    followerClout: number | undefined
    logContext:
      | 'RecommendedFollowsItem'
      | 'PostThreadItem'
      | 'ProfileCard'
      | 'ProfileHeader'
      | 'ProfileHeaderSuggestedFollows'
      | 'ProfileMenu'
      | 'ProfileHoverCard'
      | 'AvatarButton'
  }
  'profile:unfollow': {
    logContext:
      | 'RecommendedFollowsItem'
      | 'PostThreadItem'
      | 'ProfileCard'
      | 'ProfileHeader'
      | 'ProfileHeaderSuggestedFollows'
      | 'ProfileMenu'
      | 'ProfileHoverCard'
      | 'Chat'
      | 'AvatarButton'
  }
  'chat:create': {
    logContext: 'ProfileHeader' | 'NewChatDialog' | 'SendViaChatDialog'
  }
  'chat:open': {
    logContext:
      | 'ProfileHeader'
      | 'NewChatDialog'
      | 'ChatsList'
      | 'SendViaChatDialog'
  }

  'test:all:always': {}
  'test:all:sometimes': {}
  'test:all:boosted_by_gate1': {reason: 'base' | 'gate1'}
  'test:all:boosted_by_gate2': {reason: 'base' | 'gate2'}
  'test:all:boosted_by_both': {reason: 'base' | 'gate1' | 'gate2'}
  'test:gate1:always': {}
  'test:gate1:sometimes': {}
  'test:gate2:always': {}
  'test:gate2:sometimes': {}
}
