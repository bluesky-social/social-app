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
    scope: 'current' | 'every'
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
  'router:navigate:notifications:sampled': {}
  'deepLink:referrerReceived': {
    to: string
    referrer: string
    hostname: string
  }

  // Screen events
  'splash:signInPressed': {}
  'splash:createAccountPressed': {}
  'signup:nextPressed': {
    activeStep: number
    phoneVerificationRequired?: boolean
  }
  'signup:backPressed': {
    activeStep: number
  }
  'signup:captchaSuccess': {}
  'signup:captchaFailure': {}
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
  'onboarding:finished:nextPressed': {
    usedStarterPack: boolean
    starterPackName?: string
    starterPackCreator?: string
    starterPackUri?: string
    profilesFollowed: number
    feedsPinned: number
  }
  'onboarding:finished:avatarResult': {
    avatarResult: 'default' | 'created' | 'uploaded'
  }
  'home:feedDisplayed:sampled': {
    feedUrl: string
    feedType: string
    index: number
    reason:
      | 'focus'
      | 'tabbar-click'
      | 'pager-swipe'
      | 'desktop-sidebar-click'
      | 'starter-pack-initial-feed'
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
  'discover:showMore': {
    feedContext: string
  }
  'discover:showLess': {
    feedContext: string
  }
  'discover:clickthrough:sampled': {
    count: number
  }
  'discover:engaged:sampled': {
    count: number
  }
  'discover:seen:sampled': {
    count: number
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
  'post:like:sampled': {
    doesLikerFollowPoster: boolean | undefined
    doesPosterFollowLiker: boolean | undefined
    likerClout: number | undefined
    postClout: number | undefined
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:repost:sampled': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unlike:sampled': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:unrepost:sampled': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post'
  }
  'post:mute': {}
  'post:unmute': {}
  'post:pin': {}
  'post:unpin': {}
  'profile:follow:sampled': {
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
      | 'StarterPackProfilesList'
      | 'FeedInterstitial'
      | 'ProfileHeaderSuggestedFollows'
  }
  'profile:unfollow:sampled': {
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
      | 'StarterPackProfilesList'
      | 'FeedInterstitial'
      | 'ProfileHeaderSuggestedFollows'
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
  'starterPack:share': {
    starterPack: string
    shareType: 'link' | 'qrcode'
    qrShareType?: 'save' | 'copy' | 'share'
  }
  'starterPack:followAll': {
    logContext: 'StarterPackProfilesList' | 'Onboarding'
    starterPack: string
    count: number
  }
  'starterPack:delete': {}
  'starterPack:create': {
    setName: boolean
    setDescription: boolean
    profilesCount: number
    feedsCount: number
  }
  'starterPack:ctaPress': {
    starterPack: string
  }
  'starterPack:opened': {
    starterPack: string
  }

  'feed:interstitial:profileCard:press': {}
  'feed:interstitial:feedCard:press': {}

  'profile:header:suggestedFollowsCard:press': {}

  'test:all:always': {}
  'test:all:sometimes': {}
  'test:all:boosted_by_gate1': {reason: 'base' | 'gate1'}
  'test:all:boosted_by_gate2': {reason: 'base' | 'gate2'}
  'test:all:boosted_by_both': {reason: 'base' | 'gate1' | 'gate2'}
  'test:gate1:always': {}
  'test:gate1:sometimes': {}
  'test:gate2:always': {}
  'test:gate2:sometimes': {}

  'tmd:share': {}
  'tmd:download': {}
  'tmd:post': {}
}
