export type MetricEvents = {
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
    logContext:
      | 'SwitchAccount'
      | 'Settings'
      | 'SignupQueued'
      | 'Deactivated'
      | 'Takendown'
    scope: 'current' | 'every'
  }
  'notifications:openApp': {}
  'notifications:request': {
    context: 'StartOnboarding' | 'AfterOnboarding' | 'Login' | 'Home'
    status: 'granted' | 'denied' | 'undetermined'
  }
  'state:background': {
    secondsActive: number
  }
  'state:foreground': {}
  'router:navigate': {
    from?: string
  }
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
  'signup:fieldError': {
    field: string
    errorCount: number
    errorMessage: string
    activeStep: number
  }
  'signup:backgrounded': {
    activeStep: number
    backgroundCount: number
  }
  'signup:handleTaken': {}
  'signin:hostingProviderPressed': {
    hostingProviderDidChange: boolean
  }
  'signin:hostingProviderFailedResolution': {}
  'signin:success': {
    failedAttemptsCount: number
    isUsingCustomProvider: boolean
    timeTakenSeconds: number
  }
  'signin:backPressed': {
    failedAttemptsCount: number
  }
  'signin:forgotPasswordPressed': {}
  'signin:passwordReset': {}
  'signin:passwordResetSuccess': {}
  'signin:passwordResetFailure': {}
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
  'home:feedDisplayed': {
    feedUrl: string
    feedType: string
    index: number
  }
  'feed:endReached': {
    feedUrl: string
    feedType: string
    itemCount: number
  }
  'feed:refresh': {
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
  'discover:clickthrough': {
    count: number
  }
  'discover:engaged': {
    count: number
  }
  'discover:seen': {
    count: number
  }

  'composer:gif:open': {}
  'composer:gif:select': {}

  // Data events
  'account:create:begin': {}
  'account:create:success': {
    signupDuration: number
    fieldErrorsTotal: number
    backgroundCount: number
  }
  'post:create': {
    imageCount: number
    isReply: boolean
    isPartOfThread: boolean
    hasLink: boolean
    hasQuote: boolean
    langs: string
    logContext: 'Composer'
  }
  'thread:create': {
    postCount: number
    isReply: boolean
  }
  'post:like': {
    doesLikerFollowPoster: boolean | undefined
    doesPosterFollowLiker: boolean | undefined
    likerClout: number | undefined
    postClout: number | undefined
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  }
  'post:repost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  }
  'post:unlike': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  }
  'post:unrepost': {
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  }
  'post:mute': {}
  'post:unmute': {}
  'post:pin': {}
  'post:unpin': {}
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
      | 'StarterPackProfilesList'
      | 'FeedInterstitial'
      | 'ProfileHeaderSuggestedFollows'
      | 'PostOnboardingFindFollows'
      | 'ImmersiveVideo'
  }
  'suggestedUser:follow': {
    logContext:
      | 'Explore'
      | 'InterstitialDiscover'
      | 'InterstitialProfile'
      | 'Profile'
    location: 'Card' | 'Profile'
    recId?: number
    position: number
  }
  'suggestedUser:press': {
    logContext: 'Explore' | 'InterstitialDiscover' | 'InterstitialProfile'
    recId?: number
    position: number
  }
  'suggestedUser:seen': {
    logContext: 'Explore' | 'InterstitialDiscover' | 'InterstitialProfile'
    recId?: number
    position: number
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
      | 'StarterPackProfilesList'
      | 'FeedInterstitial'
      | 'ProfileHeaderSuggestedFollows'
      | 'PostOnboardingFindFollows'
      | 'ImmersiveVideo'
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
  'link:clicked': {
    url: string
    domain: string
  }

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

  'trendingTopics:show': {
    context: 'settings'
  }
  'trendingTopics:hide': {
    context: 'settings' | 'sidebar' | 'interstitial' | 'explore:trending'
  }
  'trendingTopic:click': {
    context: 'sidebar' | 'interstitial' | 'explore'
  }
  'recommendedTopic:click': {
    context: 'explore'
  }
  'trendingVideos:show': {
    context: 'settings'
  }
  'trendingVideos:hide': {
    context: 'settings' | 'interstitial:discover' | 'interstitial:explore'
  }
  'videoCard:click': {
    context: 'interstitial:discover' | 'interstitial:explore' | 'feed'
  }

  'progressGuide:hide': {}
  'progressGuide:followDialog:open': {}

  'moderation:subscribedToLabeler': {}
  'moderation:unsubscribedFromLabeler': {}
  'moderation:changeLabelPreference': {
    preference: string
  }

  'moderation:subscribedToList': {
    listType: 'mute' | 'block'
  }
  'moderation:unsubscribedFromList': {
    listType: 'mute' | 'block'
  }

  'reportDialog:open': {
    subjectType: string
  }
  'reportDialog:close': {}
  'reportDialog:success': {
    reason: string
    labeler: string
    details: boolean
  }
  'reportDialog:failure': {}
}
