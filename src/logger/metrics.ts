import {type NotificationReason} from '#/lib/hooks/useNotificationHandler'
import {type FeedDescriptor} from '#/state/queries/post-feed'

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
      | 'AgeAssuranceNoAccessScreen'
    scope: 'current' | 'every'
  }
  'notifications:openApp': {
    reason: NotificationReason
    causedBoot: boolean
  }
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
  'welcomeModal:signupClicked': {}
  'welcomeModal:exploreClicked': {}
  'welcomeModal:signinClicked': {}
  'welcomeModal:dismissed': {}
  'welcomeModal:presented': {}
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
  'signup:handleTaken': {typeahead?: boolean}
  'signup:handleAvailable': {typeahead?: boolean}
  'signup:handleSuggestionSelected': {method: string}
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
  'onboarding:suggestedAccounts:tabPressed': {
    tab: string
  }
  'onboarding:suggestedAccounts:followAllPressed': {
    tab: string
    numAccounts: number
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
  'onboarding:valueProp:stepOne:nextPressed': {}
  'onboarding:valueProp:stepTwo:nextPressed': {}
  'onboarding:valueProp:skipPressed': {}
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
  'feed:save': {
    feedUrl: string
  }
  'feed:unsave': {
    feedUrl: string
  }
  'feed:pin': {
    feedUrl: string
  }
  'feed:unpin': {
    feedUrl: string
  }
  'feed:like': {
    feedUrl: string
  }
  'feed:unlike': {
    feedUrl: string
  }
  'feed:share': {
    feedUrl: string
  }
  'feed:suggestion:seen': {
    feedUrl: string
  }
  'feed:suggestion:press': {
    feedUrl: string
  }
  'post:showMore': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:showLess': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'feed:clickthrough': {
    feed: string
    count: number
  }
  'feed:engaged': {
    feed: string
    count: number
  }
  'feed:seen': {
    feed: string
    count: number
  }

  'feed:discover:emptyError': {
    userDid: string
  }

  'composer:gif:open': {}
  'composer:gif:select': {}
  'composerPrompt:press': {}
  'composerPrompt:camera:press': {}
  'composerPrompt:gallery:press': {}

  'composer:threadgate:open': {
    nudged: boolean
  }
  'composer:threadgate:save': {
    replyOptions: string
    quotesEnabled: boolean
    persist: boolean
    hasChanged: boolean
  }

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
    uri: string
    authorDid: string
    doesLikerFollowPoster: boolean | undefined
    doesPosterFollowLiker: boolean | undefined
    likerClout: number | undefined
    postClout: number | undefined
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
  }
  'post:repost': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
  }
  'post:unlike': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
  }
  'post:unrepost': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
  }
  'post:mute': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:unmute': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:pin': {}
  'post:unpin': {}
  'post:bookmark': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:unbookmark': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:clickReply': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:clickQuotePost': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:clickthroughAuthor': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:clickthroughItem': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:clickthroughEmbed': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    position?: number
  }
  'post:view': {
    uri: string
    authorDid: string
    logContext:
      | 'FeedItem'
      | 'PostThreadItem'
      | 'Post'
      | 'ImmersiveVideo'
      | 'SearchResults'
      | 'Bookmarks'
      | 'Notifications'
      | 'Hashtag'
      | 'Topic'
      | 'PostQuotes'
    feedDescriptor?: string
    position?: number
  }
  'bookmarks:view': {}
  'bookmarks:post-clicked': {}
  'profile:follow': {
    contextProfileDid?: string
    didBecomeMutual: boolean | undefined
    followeeClout: number | undefined
    followeeDid: string
    followerClout: number | undefined
    position?: number
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
      | 'ExploreSuggestedAccounts'
      | 'OnboardingSuggestedAccounts'
      | 'FindContacts'
  }
  'profile:followers:view': {
    contextProfileDid: string
    isOwnProfile: boolean
  }
  'profile:followers:paginate': {
    contextProfileDid: string
    itemCount: number
    page: number
  }
  'profile:following:view': {
    contextProfileDid: string
    isOwnProfile: boolean
  }
  'profile:following:paginate': {
    contextProfileDid: string
    itemCount: number
    page: number
  }
  'profileCard:seen': {
    contextProfileDid?: string
    profileDid: string
    position?: number
  }
  'suggestedUser:follow': {
    logContext:
      | 'Explore'
      | 'InterstitialDiscover'
      | 'InterstitialProfile'
      | 'Profile'
      | 'Onboarding'
    location: 'Card' | 'Profile'
    recId?: number
    position: number
    suggestedDid: string
    category: string | null
  }
  'suggestedUser:press': {
    logContext:
      | 'Explore'
      | 'InterstitialDiscover'
      | 'InterstitialProfile'
      | 'Onboarding'
    recId?: number
    position: number
    suggestedDid: string
    category: string | null
  }
  'suggestedUser:seen': {
    logContext:
      | 'Explore'
      | 'InterstitialDiscover'
      | 'InterstitialProfile'
      | 'Profile'
      | 'Onboarding'
      | 'ProgressGuide'
    recId?: number
    position: number
    suggestedDid: string
    category: string | null
  }
  'suggestedUser:seeMore': {
    logContext:
      | 'Explore'
      | 'InterstitialDiscover'
      | 'InterstitialProfile'
      | 'Profile'
      | 'Onboarding'
  }
  'suggestedUser:dismiss': {
    logContext: 'InterstitialDiscover' | 'InterstitialProfile'
    recId?: number
    position: number
    suggestedDid: string
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
      | 'ExploreSuggestedAccounts'
      | 'OnboardingSuggestedAccounts'
      | 'FindContacts'
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
  'starterPack:addUser': {
    starterPack?: string
  }
  'starterPack:removeUser': {
    starterPack?: string
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
  'desktopFeeds:feed:click': {
    feedUri: string
    feedDescriptor: string
  }

  'profile:header:suggestedFollowsCard:press': {}
  'profile:addToStarterPack': {}

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

  'explore:module:seen': {
    module:
      | 'trendingTopics'
      | 'trendingVideos'
      | 'suggestedAccounts'
      | 'suggestedFeeds'
      | 'suggestedStarterPacks'
      | `feed:${FeedDescriptor}`
  }
  'explore:module:searchButtonPress': {
    module: 'suggestedAccounts' | 'suggestedFeeds'
  }
  'explore:suggestedAccounts:tabPressed': {
    tab: string
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

  translate: {
    sourceLanguages: string[]
    targetLanguage: string
    textLength: number
  }

  'verification:create': {}
  'verification:revoke': {}
  'verification:badge:click': {}
  'verification:learn-more': {
    location:
      | 'initialAnnouncementeNux'
      | 'verificationsDialog'
      | 'verifierDialog'
      | 'verificationSettings'
  }
  'verification:settings:hideBadges': {}
  'verification:settings:unHideBadges': {}

  'live:create': {duration: number}
  'live:edit': {}
  'live:remove': {}
  'live:card:open': {subject: string; from: 'post' | 'profile'}
  'live:card:watch': {subject: string}
  'live:card:openProfile': {subject: string}
  'live:view:profile': {subject: string}
  'live:view:post': {subject: string; feed?: string}

  'post:share': {
    uri: string
    authorDid: string
    logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
    feedDescriptor?: string
    postContext: 'feed' | 'thread'
    position?: number
  }
  'share:press:copyLink': {}
  'share:press:nativeShare': {}
  'share:press:openDmSearch': {}
  'share:press:dmSelected': {}
  'share:press:recentDm': {}
  'share:press:embed': {}

  'thread:click:showOtherReplies': {}
  'thread:click:hideReplyForMe': {}
  'thread:click:hideReplyForEveryone': {}
  'thread:preferences:load': {
    [key: string]: any
  }
  'thread:preferences:update': {
    [key: string]: any
  }
  'thread:click:headerMenuOpen': {}
  'thread:click:editOwnThreadgate': {}
  'thread:click:viewSomeoneElsesThreadgate': {}
  'activitySubscription:enable': {
    setting: 'posts' | 'posts_and_replies'
  }
  'activitySubscription:disable': {}
  'activityPreference:changeChannels': {
    name: string
    push: boolean
    list: boolean
  }
  'activityPreference:changeFilter': {
    name: string
    value: string
  }

  'ageAssurance:navigateToSettings': {}
  'ageAssurance:dismissFeedBanner': {}
  'ageAssurance:dismissSettingsNotice': {}
  'ageAssurance:initDialogOpen': {
    hasInitiatedPreviously: boolean
  }
  'ageAssurance:initDialogSubmit': {}
  'ageAssurance:api:begin': {
    platform: string
    countryCode: string
    regionCode?: string
  }
  'ageAssurance:initDialogError': {
    code: string
  }
  'ageAssurance:redirectDialogOpen': {}
  'ageAssurance:redirectDialogSuccess': {}
  'ageAssurance:redirectDialogFail': {}
  'ageAssurance:appealDialogOpen': {}
  'ageAssurance:appealDialogSubmit': {}
  'ageAssurance:noAccessScreen:shown': {
    accountCreatedAt: string
    isAARegion: boolean
    hasDeclaredAge: boolean
    canUpdateBirthday: boolean
  }
  'ageAssurance:noAccessScreen:openBirthdateDialog': {}

  /*
   * Specifically for the `BlockedGeoOverlay`
   */
  'blockedGeoOverlay:shown': {}

  'geo:debug': {}

  /*
   * Find Contacts stuff
   */

  // user presses the button on the new feature NUX
  'contacts:nux:ctaPressed': {}
  // user presses the banner NUX
  'contacts:nux:bannerPressed': {}
  // user dismisses the banner
  'contacts:nux:bannerDismissed': {}

  // user lands on the contacts step
  'onboarding:contacts:presented': {}
  // user pressed "Import Contacts" button to begin flow
  'onboarding:contacts:begin': {}
  // skips the step entirely
  'onboarding:contacts:skipPressed': {}
  // user shared their contacts
  'onboarding:contacts:contactsShared': {}
  // user leaves the matches page
  'onboarding:contacts:nextPressed': {
    matchCount: number
    followCount: number
    dismissedMatchCount: number
  }

  // user entered a number
  'contacts:phone:phoneEntered': {
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user entered the correct one-time-code
  'contacts:phone:phoneVerified': {
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user responded to the contacts permission prompt
  'contacts:permission:request': {
    status: 'granted' | 'denied'
    accessLevelIOS?: 'all' | 'limited' | 'none'
  }
  // contacts were successfully imported and matched
  'contacts:import:success': {
    contactCount: number
    matchCount: number
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // contacts import failed
  'contacts:import:failure': {
    reason: 'noValidNumbers' | 'networkError' | 'unknown'
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user followed a single match
  'contacts:matches:follow': {
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user pressed "Follow All" on matches
  'contacts:matches:followAll': {
    followCount: number
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user dismissed a match
  'contacts:matches:dismiss': {
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user pressed invite to send an SMS to a non-match
  'contacts:matches:invite': {
    entryPoint: 'Onboarding' | 'Standalone'
  }
  // user opened the Find Contacts settings screen
  'contacts:settings:presented': {
    hasPreviouslySynced: boolean
    matchCount?: number
  }
  // user followed a single match from settings
  'contacts:settings:follow': {}
  // user pressed "Follow All" from settings
  'contacts:settings:followAll': {
    followCount: number
  }
  // user dismissed a match from settings
  'contacts:settings:dismiss': {}
  // user re-entered the flow via the resync button
  'contacts:settings:resync': {
    daysSinceLastSync: number
  }
  // user pressed the remove all data button
  'contacts:settings:removeData': {}
}
